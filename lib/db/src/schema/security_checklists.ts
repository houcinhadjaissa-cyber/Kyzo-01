import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const securityChecklistsTable = pgTable("security_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("project_id").notNull().unique(),
  authConfigured: boolean("auth_configured").notNull().default(false),
  rateLimitingEnabled: boolean("rate_limiting_enabled").notNull().default(false),
  inputValidation: boolean("input_validation").notNull().default(false),
  corsConfigured: boolean("cors_configured").notNull().default(false),
  helmetEnabled: boolean("helmet_enabled").notNull().default(false),
  envSecretsProtected: boolean("env_secrets_protected").notNull().default(false),
  sqlInjectionPrevented: boolean("sql_injection_prevented").notNull().default(false),
  xssProtection: boolean("xss_protection").notNull().default(false),
  httpsOnly: boolean("https_only").notNull().default(false),
  dependenciesScanned: boolean("dependencies_scanned").notNull().default(false),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  passedAt: timestamp("passed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSecurityChecklistSchema = createInsertSchema(securityChecklistsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSecurityChecklist = z.infer<typeof insertSecurityChecklistSchema>;
export type SecurityChecklist = typeof securityChecklistsTable.$inferSelect;
