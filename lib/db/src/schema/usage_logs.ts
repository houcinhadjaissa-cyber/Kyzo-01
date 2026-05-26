// @ts-nocheck
import { pgTable, text, timestamp, uuid, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usageLogsTable = pgTable("usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("project_id"),
  conversationId: uuid("conversation_id"),
  modelId: text("model_id").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  estimatedCostUsd: real("estimated_cost_usd").notNull().default(0),
  taskType: text("task_type"), // "code_generation" | "security_audit" | "ui_styling" | "architecture"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUsageLogSchema = createInsertSchema(usageLogsTable).omit({ id: true, createdAt: true });
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type UsageLog = typeof usageLogsTable.$inferSelect;
