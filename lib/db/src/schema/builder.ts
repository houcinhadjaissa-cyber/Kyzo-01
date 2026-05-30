// @ts-nocheck
import { pgTable, text, timestamp, integer, sql } from "drizzle-orm/pg-core";

export const builderProjectsTable = pgTable("builder_projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  htmlContent: text("html_content").default(""),
  previewUrl: text("preview_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const builderMessagesTable = pgTable("builder_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => builderProjectsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  model: text("model"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const builderSnapshotsTable = pgTable("builder_snapshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => builderProjectsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  htmlContent: text("html_content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BuilderProject = typeof builderProjectsTable.$inferSelect;
export type BuilderMessage = typeof builderMessagesTable.$inferSelect;
export type BuilderSnapshot = typeof builderSnapshotsTable.$inferSelect;
