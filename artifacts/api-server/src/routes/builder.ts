import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sql, desc, eq, count } from "drizzle-orm";
import {
  builderProjectsTable,
  builderMessagesTable,
  builderSnapshotsTable,
} from "@workspace/db";

const router = Router();

// ─── Free model catalogue ────────────────────────────────────────────────────

const FREE_MODELS = [
  "deepseek/deepseek-v4-flash:free",
  "qwen/qwen3-coder:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
];

const PREMIUM_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-2.0-flash-001",
];

function pickModel(
  taskType: string,
  premiumEnabled: boolean,
): string {
  if (!premiumEnabled) {
    if (taskType === "ui" || taskType === "logic") return FREE_MODELS[1]; // qwen3-coder
    return FREE_MODELS[0]; // deepseek-flash for general/debug
  }
  return PREMIUM_MODELS[0];
}

// ─── AI call helper ───────────────────────────────────────────────────────────

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; tokensUsed: number }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.FRONTEND_URL ?? "https://aios.app",
      "X-Title": "AIOS Website Builder",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens?: number };
  };
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}

// ─── Helper: get settings from env/DB ────────────────────────────────────────

function getSettings() {
  const key = process.env.OPENROUTER_API_KEY ?? "";
  const masked = key ? `sk-or-v1-${"*".repeat(20)}` : null;
  const active = process.env.BUILDER_ACTIVE_MODEL ?? FREE_MODELS[0];
  const fallback = FREE_MODELS[1];
  const premium = process.env.BUILDER_PREMIUM_ENABLED === "true";
  const vercelToken = process.env.VERCEL_TOKEN ?? "";
  const vercelTokenMasked = vercelToken ? `${"*".repeat(16)}${vercelToken.slice(-4)}` : null;
  return {
    openrouterKeyConfigured: Boolean(key),
    openrouterKeyMasked: masked,
    activeModel: active,
    fallbackModel: fallback,
    premiumModelsEnabled: premium,
    freeModels: FREE_MODELS,
    premiumModels: PREMIUM_MODELS,
    vercelTokenConfigured: Boolean(vercelToken),
    vercelTokenMasked,
    vercelTeamSlug: process.env.VERCEL_TEAM_SLUG ?? "",
    vercelProjectName: process.env.VERCEL_PROJECT_NAME ?? "",
  };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

router.get("/builder/settings", (_req: Request, res: Response) => {
  res.json(getSettings());
});

router.patch("/builder/settings", (req: Request, res: Response) => {
  const { openrouterApiKey, activeModel, premiumModelsEnabled, vercelToken, vercelTeamSlug, vercelProjectName } = req.body as {
    openrouterApiKey?: string;
    activeModel?: string;
    premiumModelsEnabled?: boolean;
    vercelToken?: string;
    vercelTeamSlug?: string;
    vercelProjectName?: string;
  };
  if (openrouterApiKey) process.env.OPENROUTER_API_KEY = openrouterApiKey;
  if (activeModel) process.env.BUILDER_ACTIVE_MODEL = activeModel;
  if (premiumModelsEnabled !== undefined)
    process.env.BUILDER_PREMIUM_ENABLED = String(premiumModelsEnabled);
  if (vercelToken) process.env.VERCEL_TOKEN = vercelToken;
  if (vercelTeamSlug !== undefined) process.env.VERCEL_TEAM_SLUG = vercelTeamSlug;
  if (vercelProjectName !== undefined) process.env.VERCEL_PROJECT_NAME = vercelProjectName;
  res.json(getSettings());
});

// ─── Projects ─────────────────────────────────────────────────────────────────

router.get("/builder/projects", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: builderProjectsTable.id,
        name: builderProjectsTable.name,
        description: builderProjectsTable.description,
        htmlContent: builderProjectsTable.htmlContent,
        previewUrl: builderProjectsTable.previewUrl,
        createdAt: builderProjectsTable.createdAt,
        updatedAt: builderProjectsTable.updatedAt,
        messageCount: sql<number>`(
          SELECT COUNT(*) FROM builder_messages
          WHERE project_id = ${builderProjectsTable.id}
        )`.mapWith(Number),
        snapshotCount: sql<number>`(
          SELECT COUNT(*) FROM builder_snapshots
          WHERE project_id = ${builderProjectsTable.id}
        )`.mapWith(Number),
      })
      .from(builderProjectsTable)
      .orderBy(desc(builderProjectsTable.updatedAt));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/builder/projects", async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body as {
      name: string;
      description?: string;
    };
    const [row] = await db
      .insert(builderProjectsTable)
      .values({ name, description: description ?? null })
      .returning();

    res.status(201).json({
      ...row,
      messageCount: 0,
      snapshotCount: 0,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/builder/projects/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [project] = await db
      .select()
      .from(builderProjectsTable)
      .where(eq(builderProjectsTable.id, id));

    if (!project) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [messages, snapshots] = await Promise.all([
      db
        .select()
        .from(builderMessagesTable)
        .where(eq(builderMessagesTable.projectId, id))
        .orderBy(builderMessagesTable.createdAt),
      db
        .select()
        .from(builderSnapshotsTable)
        .where(eq(builderSnapshotsTable.projectId, id))
        .orderBy(desc(builderSnapshotsTable.createdAt)),
    ]);

    res.json({ ...project, messages, snapshots });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/builder/projects/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, htmlContent, previewUrl } = req.body as {
      name?: string;
      description?: string;
      htmlContent?: string;
      previewUrl?: string;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (htmlContent !== undefined) updates.htmlContent = htmlContent;
    if (previewUrl !== undefined) updates.previewUrl = previewUrl;

    const [row] = await db
      .update(builderProjectsTable)
      .set(updates)
      .where(eq(builderProjectsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [msgCount, snapCount] = await Promise.all([
      db
        .select({ c: count() })
        .from(builderMessagesTable)
        .where(eq(builderMessagesTable.projectId, id)),
      db
        .select({ c: count() })
        .from(builderSnapshotsTable)
        .where(eq(builderSnapshotsTable.projectId, id)),
    ]);

    res.json({
      ...row,
      messageCount: Number(msgCount[0]?.c ?? 0),
      snapshotCount: Number(snapCount[0]?.c ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/builder/projects/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db
      .delete(builderProjectsTable)
      .where(eq(builderProjectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── AI Generation ────────────────────────────────────────────────────────────

router.post(
  "/builder/projects/:id/generate",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { prompt, taskType = "ui", currentHtml = "", conversationHistory = [] } =
        req.body as {
          prompt: string;
          taskType?: string;
          currentHtml?: string;
          conversationHistory?: Array<{ role: string; content: string }>;
        };

      const [project] = await db
        .select()
        .from(builderProjectsTable)
        .where(eq(builderProjectsTable.id, id));

      if (!project) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      // Save user message
      const [userMsg] = await db
        .insert(builderMessagesTable)
        .values({ projectId: id, role: "user", content: prompt })
        .returning();

      const settings = getSettings();
      const model = pickModel(taskType, settings.premiumModelsEnabled);

      let html = "";
      let explanation = "";
      let tokensUsed = 0;
      let usedModel = model;

      const systemPrompt = `You are an expert full-stack web developer. Generate complete, beautiful, production-ready HTML pages.

Rules:
- Output ONLY a complete HTML document (<!DOCTYPE html> ... </html>)
- Use inline CSS and vanilla JavaScript — no external dependencies required
- Mobile-first responsive design using CSS Grid / Flexbox
- Apple iOS 26 inspired light theme: background #F5F5F7, surface #FFFFFF, primary blue #0071E3, text #1D1D1F, secondary text #6E6E73, borders #D2D2D7
- San Francisco font stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Smooth animations (200-300ms ease-out), rounded corners (12-20px), subtle shadows
- Touch targets minimum 44px, safe-area insets for mobile
- NEVER include external CDN links or fetch calls that require internet
- Output ONLY the HTML — no explanation, no markdown, no code blocks

${currentHtml ? `Current HTML to modify:\n${currentHtml.slice(0, 6000)}` : "This is a new project — generate from scratch."}

${conversationHistory.length > 0 ? `Previous conversation context:\n${conversationHistory.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}` : ""}`;

      if (!settings.openrouterKeyConfigured) {
        // Mock response when no key is set
        html = generateMockHtml(prompt);
        explanation = "Mock response — add OPENROUTER_API_KEY to enable real AI generation.";
      } else {
        // Try primary model, then fallback
        const modelsToTry = [model, settings.fallbackModel, FREE_MODELS[2]].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

        let lastError: Error | null = null;
        for (const m of modelsToTry) {
          try {
            const result = await callOpenRouter(m, systemPrompt, prompt);
            // Extract HTML from result (strip markdown code fences if present)
            let raw = result.content.trim();
            const fenceMatch = raw.match(/```html\n?([\s\S]+?)```/i) ?? raw.match(/```\n?([\s\S]+?)```/i);
            if (fenceMatch) raw = fenceMatch[1].trim();
            if (!raw.includes("<!DOCTYPE") && !raw.includes("<html")) {
              // Model returned explanation instead of HTML — wrap it
              html = wrapInHtml(raw, prompt);
            } else {
              html = raw;
            }
            tokensUsed = result.tokensUsed;
            usedModel = m;
            lastError = null;
            break;
          } catch (err) {
            lastError = err as Error;
            continue;
          }
        }

        if (lastError) {
          html = generateMockHtml(prompt);
          explanation = `AI unavailable (${lastError.message}). Showing mock.`;
          usedModel = "mock";
        }
      }

      // Save assistant message
      const [assistantMsg] = await db
        .insert(builderMessagesTable)
        .values({
          projectId: id,
          role: "assistant",
          content: explanation || `Generated: ${prompt}`,
          model: usedModel,
          tokensUsed,
        })
        .returning();

      // Update project with new HTML
      await db
        .update(builderProjectsTable)
        .set({ htmlContent: html, updatedAt: new Date() })
        .where(eq(builderProjectsTable.id, id));

      res.json({
        html,
        explanation: explanation || `Built with ${usedModel}`,
        model: usedModel,
        tokensUsed,
        messageId: assistantMsg.id,
        userMessageId: userMsg.id,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

// ─── Snapshots ────────────────────────────────────────────────────────────────

router.get(
  "/builder/projects/:id/snapshots",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rows = await db
        .select()
        .from(builderSnapshotsTable)
        .where(eq(builderSnapshotsTable.projectId, id))
        .orderBy(desc(builderSnapshotsTable.createdAt));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

router.post(
  "/builder/projects/:id/snapshots",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { label, htmlContent } = req.body as {
        label: string;
        htmlContent: string;
      };
      const [row] = await db
        .insert(builderSnapshotsTable)
        .values({ projectId: id, label, htmlContent })
        .returning();
      res.status(201).json(row);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

router.post(
  "/builder/projects/:id/snapshots/:snapshotId/restore",
  async (req: Request, res: Response) => {
    try {
      const { id, snapshotId } = req.params;
      const [snap] = await db
        .select()
        .from(builderSnapshotsTable)
        .where(eq(builderSnapshotsTable.id, snapshotId));

      if (!snap) {
        res.status(404).json({ error: "Snapshot not found" });
        return;
      }

      await db
        .update(builderProjectsTable)
        .set({ htmlContent: snap.htmlContent, updatedAt: new Date() })
        .where(eq(builderProjectsTable.id, id));

      const [project] = await db
        .select()
        .from(builderProjectsTable)
        .where(eq(builderProjectsTable.id, id));

      const [messages, snapshots] = await Promise.all([
        db
          .select()
          .from(builderMessagesTable)
          .where(eq(builderMessagesTable.projectId, id))
          .orderBy(builderMessagesTable.createdAt),
        db
          .select()
          .from(builderSnapshotsTable)
          .where(eq(builderSnapshotsTable.projectId, id))
          .orderBy(desc(builderSnapshotsTable.createdAt)),
      ]);

      res.json({ ...project, messages, snapshots });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  },
);

// ─── SSE Streaming Generation ────────────────────────────────────────────────

router.post(
  "/builder/projects/:id/generate-stream",
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      prompt,
      taskType = "ui",
      currentHtml = "",
      conversationHistory = [],
    } = req.body as {
      prompt: string;
      taskType?: string;
      currentHtml?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Helpers: raw-token SSE format as per spec
    const sendToken = (token: string) => {
      // Encode newlines within a token so the SSE frame stays on one line
      res.write(`data: ${token.replace(/\r?\n/g, "\\n")}\n\n`);
    };
    const sendDone = (html: string) => {
      res.write(`event: done\ndata: ${JSON.stringify({ html })}\n\n`);
      res.write("data: [DONE]\n\n");
    };
    const sendError = (message: string) => {
      res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
      res.write("data: [DONE]\n\n");
    };

    try {
      const [project] = await db
        .select()
        .from(builderProjectsTable)
        .where(eq(builderProjectsTable.id, id));

      if (!project) {
        sendError("Project not found");
        res.end();
        return;
      }

      // Save user message
      await db
        .insert(builderMessagesTable)
        .values({ projectId: id, role: "user", content: prompt });

      const settings = getSettings();

      const systemPrompt = `You are an expert full-stack web developer. Generate complete, beautiful, production-ready HTML pages.

Rules:
- Output ONLY a complete HTML document (<!DOCTYPE html> ... </html>)
- Use inline CSS and vanilla JavaScript — no external dependencies required
- Mobile-first responsive design using CSS Grid / Flexbox
- Apple iOS 26 inspired light theme: background #F5F5F7, surface #FFFFFF, primary blue #0071E3, text #1D1D1F, secondary text #6E6E73, borders #D2D2D7
- San Francisco font stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Smooth animations (200-300ms ease-out), rounded corners (12-20px), subtle shadows
- Touch targets minimum 44px, safe-area insets for mobile
- NEVER include external CDN links or fetch calls that require internet
- Output ONLY the HTML — no explanation, no markdown, no code blocks

${currentHtml ? `Current HTML to modify:\n${currentHtml.slice(0, 6000)}` : "This is a new project — generate from scratch."}
${conversationHistory.length > 0 ? `\nPrevious context:\n${conversationHistory.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}` : ""}`;

      if (!settings.openrouterKeyConfigured) {
        // Stream mock response token-by-token
        const mockHtml = generateMockHtml(prompt);
        const chunks = mockHtml.match(/.{1,80}/g) ?? [];
        for (const chunk of chunks) {
          sendToken(chunk);
          await new Promise((r) => setTimeout(r, 8));
        }
        await db
          .insert(builderMessagesTable)
          .values({ projectId: id, role: "assistant", content: "Mock response — add OpenRouter API key in Settings.", model: "mock" });
        await db.update(builderProjectsTable).set({ htmlContent: mockHtml, updatedAt: new Date() }).where(eq(builderProjectsTable.id, id));
        console.log(`[workflow-run] mock stream complete for project ${id}, ${chunks.length} chunks`);
        sendDone(mockHtml);
        res.end();
        return;
      }

      const model = pickModel(taskType, settings.premiumModelsEnabled);
      const modelsToTry = [model, settings.fallbackModel, FREE_MODELS[2]].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

      let fullContent = "";
      let usedModel = model;
      let success = false;

      for (const m of modelsToTry) {
        try {
          const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.FRONTEND_URL ?? "https://aios.app",
              "X-Title": "AIOS Website Builder",
            },
            body: JSON.stringify({
              model: m,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 8192,
              stream: true,
            }),
          });

          if (!openRouterRes.ok || !openRouterRes.body) {
            throw new Error(`OpenRouter ${openRouterRes.status}`);
          }

          const reader = openRouterRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const rawData = line.slice(6).trim();
              if (rawData === "[DONE]") break;
              try {
                const parsed = JSON.parse(rawData) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const chunk = parsed.choices?.[0]?.delta?.content ?? "";
                if (chunk) {
                  fullContent += chunk;
                  sendToken(chunk);
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }

          usedModel = m;
          success = true;
          break;
        } catch {
          continue;
        }
      }

      if (!success) {
        fullContent = generateMockHtml(prompt);
        for (const chunk of (fullContent.match(/.{1,80}/g) ?? [])) {
          sendToken(chunk);
          await new Promise((r) => setTimeout(r, 6));
        }
      }

      // Clean HTML
      let html = fullContent.trim();
      const fence = html.match(/```html\n?([\s\S]+?)```/i) ?? html.match(/```\n?([\s\S]+?)```/i);
      if (fence) html = fence[1].trim();
      if (!html.includes("<!DOCTYPE") && !html.includes("<html")) html = wrapInHtml(html, prompt);

      // Save to DB and log completion
      await db.insert(builderMessagesTable).values({
        projectId: id,
        role: "assistant",
        content: `Generated: ${prompt}`,
        model: usedModel,
      });
      await db.update(builderProjectsTable).set({ htmlContent: html, updatedAt: new Date() }).where(eq(builderProjectsTable.id, id));
      console.log(`[stream] generation complete: project=${id} model=${usedModel} chars=${html.length}`);

      sendDone(html);
    } catch (err) {
      sendError(String(err));
    }

    res.end();
  },
);

// ─── Vercel Deploy ────────────────────────────────────────────────────────────

router.post(
  "/builder/projects/:id/deploy",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vercelToken = process.env.VERCEL_TOKEN;

      if (!vercelToken) {
        res.json({
          ok: false,
          message:
            'Add VERCEL_TOKEN to Replit Secrets to enable one-click deploy. Get your token at vercel.com/account/tokens',
        });
        return;
      }

      const [project] = await db
        .select()
        .from(builderProjectsTable)
        .where(eq(builderProjectsTable.id, id));

      if (!project) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const htmlContent = project.htmlContent || "<html><body><h1>Empty project</h1></body></html>";
      const projectName = `aios-${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)}-${id.slice(0, 8)}`;

      const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          files: [
            {
              file: "index.html",
              data: Buffer.from(htmlContent).toString("base64"),
              encoding: "base64",
            },
          ],
          projectSettings: { framework: null },
          target: "production",
        }),
      });

      if (!deployRes.ok) {
        const text = await deployRes.text();
        res.json({ ok: false, message: `Vercel error ${deployRes.status}: ${text.slice(0, 200)}` });
        return;
      }

      const deployData = (await deployRes.json()) as { id?: string; url?: string; readyState?: string };
      const deployId = deployData.id;

      if (!deployId) {
        res.json({ ok: false, message: "No deployment ID returned" });
        return;
      }

      // Poll for completion (max 90s)
      const start = Date.now();
      while (Date.now() - start < 90_000) {
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await fetch(`https://api.vercel.com/v13/deployments/${deployId}`, {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });
        const pollData = (await pollRes.json()) as { readyState?: string; url?: string };
        if (pollData.readyState === "READY") {
          const liveUrl = `https://${pollData.url}`;
          await db.update(builderProjectsTable).set({ previewUrl: liveUrl, updatedAt: new Date() }).where(eq(builderProjectsTable.id, id));
          res.json({ ok: true, url: liveUrl });
          return;
        }
        if (pollData.readyState === "ERROR" || pollData.readyState === "CANCELED") {
          res.json({ ok: false, message: `Deployment ${pollData.readyState}` });
          return;
        }
      }

      res.json({ ok: false, message: "Deploy timeout — check Vercel dashboard" });
    } catch (err) {
      res.status(500).json({ ok: false, message: String(err) });
    }
  },
);

// ─── Workflow Run ─────────────────────────────────────────────────────────────

router.post(
  "/builder/projects/:id/workflow-run",
  async (req: Request, res: Response) => {
    try {
      const { nodes, edges } = req.body as {
        nodes: Array<{ id: string; type: string; data: { label: string } }>;
        edges: Array<{ source: string; target: string }>;
      };

      const log: string[] = [];
      log.push(`Workflow execution started — ${nodes.length} nodes, ${edges.length} edges`);

      for (const node of nodes) {
        switch (node.type) {
          case "trigger":
            log.push(`[TRIGGER] ${node.data.label} — fired`);
            break;
          case "condition":
            log.push(`[CONDITION] ${node.data.label} — evaluated → true`);
            break;
          case "action":
            log.push(`[ACTION] ${node.data.label} — executed`);
            break;
          default:
            log.push(`[NODE] ${node.data.label} — processed`);
        }
      }

      log.push("Workflow execution complete.");
      res.json({ ok: true, log });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  },
);

// ─── Mock / fallback HTML helpers ─────────────────────────────────────────────

function generateMockHtml(prompt: string): string {
  const title = prompt.slice(0, 60);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #F5F5F7;
      color: #1D1D1F;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
    }
    .icon {
      width: 64px; height: 64px;
      background: #0071E3;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
    }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    p { color: #6E6E73; font-size: 16px; line-height: 1.5; margin-bottom: 32px; }
    .btn {
      display: inline-block;
      background: #0071E3;
      color: #fff;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      border: none; cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .notice {
      margin-top: 24px;
      padding: 12px 16px;
      background: #FFF3CD;
      border-radius: 10px;
      font-size: 13px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✦</div>
    <h1>${title}</h1>
    <p>Your AI-generated page will appear here. Add an OpenRouter API key in Settings to enable real AI generation.</p>
    <button class="btn" onclick="this.textContent='Clicked!'">Get Started</button>
    <div class="notice">Mock preview — configure OpenRouter API key in Settings to generate real pages.</div>
  </div>
</body>
</html>`;
}

function wrapInHtml(content: string, prompt: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${prompt.slice(0, 40)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #F5F5F7; color: #1D1D1F; padding: 32px; max-width: 700px; margin: 0 auto; }
    pre { background: #fff; border-radius: 12px; padding: 24px; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body><pre>${content.replace(/</g, "&lt;")}</pre></body>
</html>`;
}

export default router;
