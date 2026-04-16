import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { usersTable } from "./user"

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    scope: text("scope").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>().default(null),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    actorIdx: index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    scopeCreatedAtIdx: index("audit_logs_scope_created_at_idx").on(table.scope, table.createdAt),
  })
)

