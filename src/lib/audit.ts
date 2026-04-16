import { and, desc, eq, gte, ilike, lte } from "drizzle-orm"

import { db } from "@/src/db"
import { auditLogsTable } from "@/src/db/schema/audit"

const REDACTED_KEYS = ["password", "token", "secret", "authorization", "cookie"]

export type AuditScope = "admin" | "social" | "club"

export type WriteAuditLogInput = {
  actorUserId?: string | null
  scope: AuditScope
  action: string
  targetType?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown> | null
}

export type ListAuditLogsInput = {
  scope?: AuditScope
  actorUserId?: string
  actionQuery?: string
  from?: Date
  to?: Date
  limit?: number
}

function redactMetadataValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactMetadataValue(item))
  }

  if (!value || typeof value !== "object") {
    return value
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
    if (REDACTED_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))) {
      return [key, "[redacted]"]
    }

    return [key, redactMetadataValue(nested)]
  })

  return Object.fromEntries(entries)
}

function normalizeMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) {
    return null
  }

  return redactMetadataValue(metadata) as Record<string, unknown>
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  await db.insert(auditLogsTable).values({
    id: crypto.randomUUID(),
    actorUserId: input.actorUserId ?? null,
    scope: input.scope,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: normalizeMetadata(input.metadata),
  })
}

export async function listAuditLogs(input: ListAuditLogsInput = {}) {
  const conditions = []

  if (input.scope) {
    conditions.push(eq(auditLogsTable.scope, input.scope))
  }

  if (input.actorUserId) {
    conditions.push(eq(auditLogsTable.actorUserId, input.actorUserId))
  }

  if (input.actionQuery) {
    conditions.push(ilike(auditLogsTable.action, `%${input.actionQuery}%`))
  }

  if (input.from) {
    conditions.push(gte(auditLogsTable.createdAt, input.from))
  }

  if (input.to) {
    conditions.push(lte(auditLogsTable.createdAt, input.to))
  }

  return db.query.auditLogs.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(auditLogsTable.createdAt)],
    limit: Math.min(input.limit ?? 100, 250),
  })
}

