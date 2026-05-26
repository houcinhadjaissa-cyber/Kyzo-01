import { Router, type Request, type Response as ExpressResponse } from "express";
import { db } from "@workspace/db";
import { messagesTable, conversationsTable, usageLogsTable } from "@workspace/db";

const router = Router();

const FREE_MODELS = {
  fast: {
    id: "qwen/qwen-2.5-7b-instruct:free",
    name: "Qwen 2.5 7B",
    tier: "fast" as const,
  },
  balanced: {
    id: "deepseek/deepseek-r1-distill-qwen-14b:free",
    name: "DeepSeek R1 Distill 14B",
    tier: "balanced" as const,
  },
  powerful: {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    tier: "powerful" as const,
  },
};

function routeModel(taskType: string, complexity = 0.5) {
  if (taskType === "ui_styling" || taskType === "general") {
    return { ...FREE_MODELS.fast, reason: "Simple task — using fast free model to minimize cost" };
  }
  if (taskType === "debugging" || taskType === "code_generation") {
    return { ...FREE_MODELS.balanced, reason: "Code task — using DeepSeek R1 Distill for strong code reasoning" };
  }
  if (taskType === "architecture" || taskType === "security_audit" || complexity > 0.8) {
    return { ...FREE_MODELS.powerful, reason: "Complex task — using DeepSeek R1 for deep reasoning" };
  }
  return { ...FREE_MODELS.balanced, reason: "Balanced task — using mid-tier free model" };
}

async function getOrCreateConvId(
  projectId: string,
  existingConvId: string | undefined,
  title: string,
  modelId: string,
): Promise<string> {
  if (existingConvId) return existingConvId;
  const [newConv] = await db
    .insert(conversationsTable)
    .values({ projectId, title: title.slice(0, 60), modelId })
    .returning();
  return newConv!.id;
}

router.post("/ai/route", (req: Request, res: ExpressResponse) => {
  const { taskType = "general", complexity = 0.5 } = req.body as { taskType: string; complexity: number };
  const model = routeModel(taskType, complexity);
  res.json({
    modelId: model.id,
    modelName: model.name,
    tier: model.tier,
    reason: model.reason,
    estimatedTokens: taskType === "architecture" ? 4000 : taskType === "code_generation" ? 2500 : 800,
    estimatedCostUsd: 0,
  });
});

router.post("/projects/:id/ai/message", async (req: Request, res: ExpressResponse) => {
  const projectId = String(req.params["id"]);
  const rawBody = req.body as Record<string, unknown>;
  const content = String(rawBody["content"] ?? "");
  const taskType = String(rawBody["taskType"] ?? "general");
  const existingConvId = typeof rawBody["conversationId"] === "string" ? rawBody["conversationId"] : undefined;

  const model = routeModel(taskType);

  const convId: string = await getOrCreateConvId(projectId, existingConvId, content, model.id);

  const [userMsg] = await db.insert(messagesTable).values({
    conversationId: convId,
    projectId,
    role: "user",
    content,
  }).returning();

  const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"];
  if (!OPENROUTER_API_KEY) {
    res.status(500).json({ error: "OPENROUTER_API_KEY not configured" }); return;
  }

  const systemPrompt = `You are AIOS — an elite AI software architect and engineer. You help build production-grade, secure, mobile-optimized apps for a solo non-technical founder.

Your code must always:
- Follow OWASP security best practices
- Be mobile-responsive (Tailwind CSS, React)
- Include environment variable protection (never hardcode secrets)
- Use parameterized queries for database operations
- Include proper error handling
- Be production-ready, not just prototypes

When generating code, always explain: what it does, why it's secure, and how to deploy it.
Keep responses clear and jargon-free. This user builds from their phone with no coding experience.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aios.app",
        "X-Title": "AIOS — AI Operating System",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      (req as any).log.error({ err, model: model.id }, "OpenRouter API error");
      res.status(502).json({ error: "AI model unavailable, try again shortly", detail: err }); return;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const assistantContent = data.choices[0]?.message?.content ?? "";
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    const [assistantMsg] = await db.insert(messagesTable).values({
      conversationId: convId,
      projectId,
      role: "assistant",
      content: assistantContent,
      modelId: model.id,
      tokensUsed: usage.total_tokens,
    }).returning();

    await db.insert(usageLogsTable).values({
      projectId,
      conversationId: convId,
      modelId: model.id,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCostUsd: 0,
      taskType,
    });

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      modelUsed: model.id,
      tokensUsed: usage.total_tokens,
      conversationId: convId,
    });
  } catch (err) {
    (req as any).log.error({ err }, "AI generation failed");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.get("/projects/:id/ai/stream", async (req: Request, res: ExpressResponse) => {
  const projectId = String(req.params["id"]);
  const rawPrompt = req.query["prompt"];
  const rawTaskType = req.query["taskType"];
  const rawConvId = req.query["conversationId"];

  const prompt = typeof rawPrompt === "string" ? rawPrompt : undefined;
  const taskType = (typeof rawTaskType === "string" ? rawTaskType : undefined) ?? "general";
  const existingConvId = typeof rawConvId === "string" ? rawConvId : undefined;

  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  const model = routeModel(taskType);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("start", { model: model.id, modelName: model.name, reason: model.reason });

  const OPENROUTER_API_KEY = process.env["OPENROUTER_API_KEY"];
  if (!OPENROUTER_API_KEY) {
    sendEvent("error", { message: "OPENROUTER_API_KEY not configured" });
    res.end(); return;
  }

  const isNewConv = !existingConvId;
  const convId: string = await getOrCreateConvId(projectId, existingConvId, prompt, model.id);

  if (isNewConv) {
    sendEvent("conversation", { conversationId: convId });
  }

  await db.insert(messagesTable).values({
    conversationId: convId,
    projectId,
    role: "user",
    content: prompt,
  });

  const systemPrompt = `You are AIOS — an elite AI software architect and engineer. You build production-grade, secure, mobile-optimized apps for a solo non-technical founder.

Always generate complete, copy-paste-ready code. Follow OWASP security best practices. Use environment variables for secrets. Include error handling. Be production-ready, not prototype-level.

Keep explanations clear and jargon-free. This user builds from their phone with zero coding experience.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aios.app",
        "X-Title": "AIOS — AI Operating System",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      sendEvent("error", { message: "AI model unavailable" });
      res.end(); return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta?: { content?: string }; finish_reason?: string }>;
            usage?: { total_tokens: number };
          };
          const delta = parsed.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullContent += delta;
            sendEvent("chunk", { text: delta });
          }
          if (parsed.usage?.total_tokens) totalTokens = parsed.usage.total_tokens;
        } catch {}
      }
    }

    const [assistantMsg] = await db.insert(messagesTable).values({
      conversationId: convId,
      projectId,
      role: "assistant",
      content: fullContent,
      modelId: model.id,
      tokensUsed: totalTokens,
    }).returning();

    await db.insert(usageLogsTable).values({
      projectId,
      conversationId: convId,
      modelId: model.id,
      promptTokens: 0,
      completionTokens: totalTokens,
      totalTokens,
      estimatedCostUsd: 0,
      taskType,
    });

    sendEvent("done", {
      conversationId: convId,
      messageId: assistantMsg!.id,
      tokensUsed: totalTokens,
      model: model.id,
    });
    res.end();
  } catch (err) {
    (req as any).log.error({ err }, "Streaming AI failed");
    sendEvent("error", { message: "Stream failed" });
    res.end();
  }
});

export default router;
