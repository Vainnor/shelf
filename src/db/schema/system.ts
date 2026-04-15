import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const systemSettingsTable = pgTable("system_settings", {
  id: text("id").primaryKey().default("default"),
  bootstrapCompleted: boolean("bootstrap_completed").notNull().default(false),
  signupsEnabled: boolean("signups_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

