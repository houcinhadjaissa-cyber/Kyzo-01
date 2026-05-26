import { Router } from "express";
import { db } from "@workspace/db";
import { securityChecklistsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function computeScore(checklist: Record<string, boolean>): number {
  const fields = [
    "authConfigured", "rateLimitingEnabled", "inputValidation", "corsConfigured",
    "helmetEnabled", "envSecretsProtected", "sqlInjectionPrevented",
    "xssProtection", "httpsOnly", "dependenciesScanned",
  ];
  const passed = fields.filter((f) => checklist[f]).length;
  return Math.round((passed / fields.length) * 100);
}

router.get("/projects/:id/checklist", async (req, res) => {
  const projectId = req.params["id"]!;
  let rows = await db
    .select()
    .from(securityChecklistsTable)
    .where(eq(securityChecklistsTable.projectId, projectId))
    .limit(1);

  if (!rows[0]) {
    const [created] = await db.insert(securityChecklistsTable).values({ projectId }).returning();
    rows = [created!];
  }

  const row = rows[0]!;
  const score = computeScore(row as unknown as Record<string, boolean>);
  const passed = score === 100;

  res.json({ ...row, passed, score });
});

router.patch("/projects/:id/checklist/:item", async (req, res) => {
  const { id: projectId, item } = req.params as { id: string; item: string };
  const { value } = req.body as { value: boolean };

  const validItems = [
    "authConfigured", "rateLimitingEnabled", "inputValidation", "corsConfigured",
    "helmetEnabled", "envSecretsProtected", "sqlInjectionPrevented",
    "xssProtection", "httpsOnly", "dependenciesScanned",
  ];

  if (!validItems.includes(item)) {
    res.status(400).json({ error: "Invalid checklist item" }); return;
  }

  let rows = await db
    .select()
    .from(securityChecklistsTable)
    .where(eq(securityChecklistsTable.projectId, projectId))
    .limit(1);

  if (!rows[0]) {
    await db.insert(securityChecklistsTable).values({ projectId });
    rows = await db.select().from(securityChecklistsTable).where(eq(securityChecklistsTable.projectId, projectId)).limit(1);
  }

  const updatePayload: Record<string, boolean | Date> = { [item]: value, lastCheckedAt: new Date() };
  const score = computeScore({ ...rows[0] as unknown as Record<string, boolean>, [item]: value });
  if (score === 100) updatePayload["passedAt"] = new Date();

  const [updated] = await db
    .update(securityChecklistsTable)
    .set(updatePayload)
    .where(eq(securityChecklistsTable.projectId, projectId))
    .returning();

  const finalScore = computeScore(updated as unknown as Record<string, boolean>);
  res.json({ ...updated, passed: finalScore === 100, score: finalScore });
});

export default router;
