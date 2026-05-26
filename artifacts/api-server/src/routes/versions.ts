import { Router } from "express";
import { db } from "@workspace/db";
import { projectVersionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/projects/:id/versions", async (req, res) => {
  const projectId = req.params["id"]!;
  const versions = await db
    .select()
    .from(projectVersionsTable)
    .where(eq(projectVersionsTable.projectId, projectId))
    .orderBy(desc(projectVersionsTable.createdAt));
  res.json(versions);
});

router.post("/projects/:id/versions", async (req, res) => {
  const projectId = req.params["id"]!;
  const { changelog, bumpType = "patch" } = req.body as { changelog: string; bumpType: "major" | "minor" | "patch" };

  const existing = await db
    .select()
    .from(projectVersionsTable)
    .where(eq(projectVersionsTable.projectId, projectId))
    .orderBy(desc(projectVersionsTable.createdAt))
    .limit(1);

  const latest = existing[0];
  let major = latest?.major ?? 0;
  let minor = latest?.minor ?? 0;
  let patch = latest?.patch ?? 0;

  if (bumpType === "major") { major++; minor = 0; patch = 0; }
  else if (bumpType === "minor") { minor++; patch = 0; }
  else { patch++; }

  if (major === 0 && minor === 0 && patch === 0) { major = 1; }

  const version = `${major}.${minor}.${patch}`;

  const [newVersion] = await db.insert(projectVersionsTable).values({
    projectId,
    version,
    major,
    minor,
    patch,
    changelog,
    snapshot: JSON.stringify({ createdAt: new Date().toISOString() }),
  }).returning();

  res.status(201).json(newVersion);
});

router.post("/projects/:id/versions/:versionId/rollback", async (req, res) => {
  const { id: projectId, versionId } = req.params as { id: string; versionId: string };
  const target = await db
    .select()
    .from(projectVersionsTable)
    .where(eq(projectVersionsTable.id, versionId as unknown as string))
    .limit(1);

  if (!target[0]) { res.status(404).json({ error: "Version not found" }); return; }

  res.json({
    success: true,
    message: `Rolled back to v${target[0].version}`,
    version: target[0],
  });
});

export default router;
