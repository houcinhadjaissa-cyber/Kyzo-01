// @ts-nocheck
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectVersionsTable = pgTable("project_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("project_id").notNull(),
  version: text("version").notNull(), // e.g. "1.0.0"
  major: integer("major").notNull().default(1),
  minor: integer("minor").notNull().default(0),
  patch: integer("patch").notNull().default(0),
  changelog: text("changelog").notNull().default(""),
  snapshot: text("snapshot").notNull().default("{}"), // JSON: { config, tech, deployedUrl, securityScore }
  deployedUrl: text("deployed_url"),
  securityScore: integer("security_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectVersionSchema = createInsertSchema(projectVersionsTable).omit({ id: true, createdAt: true });
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;
export type ProjectVersion = typeof projectVersionsTable.$inferSelect;
