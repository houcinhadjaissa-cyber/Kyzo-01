import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/projects/:id/conversations", async (req, res) => {
  const projectId = req.params["id"]!;
  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.projectId, projectId))
    .orderBy(desc(conversationsTable.updatedAt));
  res.json(conversations);
});

router.post("/projects/:id/conversations", async (req, res) => {
  const projectId = req.params["id"]!;
  const { title = "New Conversation", modelId = "deepseek/deepseek-r1:free" } = req.body as {
    title?: string;
    modelId?: string;
  };
  const [conv] = await db.insert(conversationsTable).values({
    projectId,
    title,
    modelId,
  }).returning();
  res.status(201).json(conv);
});

router.get("/projects/:id/conversations/:convId/messages", async (req, res) => {
  const convId = req.params["convId"]!;
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, convId as unknown as string))
    .orderBy(messagesTable.createdAt);
  res.json(messages);
});

router.delete("/projects/:id/conversations/:convId", async (req, res) => {
  const convId = req.params["convId"]!;
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, convId as unknown as string));
  await db.delete(conversationsTable).where(eq(conversationsTable.id, convId as unknown as string));
  res.status(204).send();
});

export default router;
