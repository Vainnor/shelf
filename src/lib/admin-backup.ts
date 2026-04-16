import { sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/src/db"

type SqlExecutor = {
  execute: typeof db.execute
}

const PUBLIC_SCHEMA = "public"

const backupPayloadSchema = z.object({
  formatVersion: z.literal(1),
  exportedAt: z.string(),
  source: z.object({
    app: z.literal("shelf"),
    schema: z.literal(PUBLIC_SCHEMA),
  }),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
})

export type BackupPayload = z.infer<typeof backupPayloadSchema>

export type ImportSummary = {
  insertedRows: number
  tableCount: number
  tables: Array<{ table: string; rows: number }>
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function toQualifiedTableExpression(table: string) {
  return `${quoteIdentifier(PUBLIC_SCHEMA)}.${quoteIdentifier(table)}`
}

async function listPublicTables(executor: SqlExecutor) {
  const result = await executor.execute(sql`
    select table_name
    from information_schema.tables
    where table_schema = ${PUBLIC_SCHEMA}
      and table_type = 'BASE TABLE'
    order by table_name asc
  `)

  return result.rows
    .map((row) => String((row as { table_name: string }).table_name))
    .filter((tableName) => tableName.length > 0)
}

async function listForeignKeyDependencies(executor: SqlExecutor) {
  const result = await executor.execute(sql`
    select
      tc.table_name as table_name,
      ccu.table_name as referenced_table_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
      and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = ${PUBLIC_SCHEMA}
      and ccu.table_schema = ${PUBLIC_SCHEMA}
  `)

  return result.rows.map((row) => {
    const typed = row as { table_name: string; referenced_table_name: string }
    return {
      table: String(typed.table_name),
      referencedTable: String(typed.referenced_table_name),
    }
  })
}

function sortTablesForInsert(tables: string[], dependencies: Array<{ table: string; referencedTable: string }>) {
  const tableSet = new Set(tables)
  const dependencyGraph = new Map<string, Set<string>>()
  const reverseGraph = new Map<string, Set<string>>()

  for (const table of tables) {
    dependencyGraph.set(table, new Set())
    reverseGraph.set(table, new Set())
  }

  for (const { table, referencedTable } of dependencies) {
    if (!tableSet.has(table) || !tableSet.has(referencedTable) || table === referencedTable) {
      continue
    }

    dependencyGraph.get(table)?.add(referencedTable)
    reverseGraph.get(referencedTable)?.add(table)
  }

  const queue: string[] = tables.filter((table) => (dependencyGraph.get(table)?.size ?? 0) === 0)
  const sorted: string[] = []

  while (queue.length > 0) {
    const table = queue.shift() as string
    sorted.push(table)

    for (const dependent of reverseGraph.get(table) ?? []) {
      const deps = dependencyGraph.get(dependent)
      if (!deps) {
        continue
      }

      deps.delete(table)
      if (deps.size === 0) {
        queue.push(dependent)
      }
    }
  }

  if (sorted.length === tables.length) {
    return sorted
  }

  // Cycles are rare for this schema; append any unresolved tables to preserve behavior.
  const unresolved = tables.filter((table) => !sorted.includes(table))
  return [...sorted, ...unresolved]
}

export async function exportDatabaseAsJson() {
  const tableNames = await listPublicTables(db)
  const tables: Record<string, Array<Record<string, unknown>>> = {}
  let totalRows = 0

  for (const tableName of tableNames) {
    const tableResult = await db.execute(sql.raw(`select * from ${toQualifiedTableExpression(tableName)}`))
    const rows = tableResult.rows.map((row) => row as Record<string, unknown>)
    tables[tableName] = rows
    totalRows += rows.length
  }

  const payload: BackupPayload = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    source: {
      app: "shelf",
      schema: PUBLIC_SCHEMA,
    },
    tables,
  }

  return {
    payload,
    tableCount: tableNames.length,
    rowCount: totalRows,
  }
}

export async function importDatabaseFromJson(input: unknown): Promise<ImportSummary> {
  const parsed = backupPayloadSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error("Invalid backup file format.")
  }

  const payload = parsed.data
  const currentTables = await listPublicTables(db)
  const payloadTables = Object.keys(payload.tables).sort((a, b) => a.localeCompare(b))

  const unknownTables = payloadTables.filter((table) => !currentTables.includes(table))
  if (unknownTables.length > 0) {
    throw new Error(`Backup contains unknown tables for this instance: ${unknownTables.join(", ")}.`)
  }

  const missingTables = currentTables.filter((table) => !payloadTables.includes(table))
  if (missingTables.length > 0) {
    throw new Error(`Backup is missing tables required by this instance: ${missingTables.join(", ")}.`)
  }

  const dependencies = await listForeignKeyDependencies(db)
  const insertOrder = sortTablesForInsert(currentTables, dependencies)

  return db.transaction(async (tx) => {
    const truncateExpression = currentTables.map(toQualifiedTableExpression).join(", ")
    await tx.execute(sql.raw(`truncate table ${truncateExpression} restart identity cascade`))

    let insertedRows = 0
    const tableSummaries: Array<{ table: string; rows: number }> = []

    for (const tableName of insertOrder) {
      const rows = payload.tables[tableName] ?? []
      if (rows.length === 0) {
        tableSummaries.push({ table: tableName, rows: 0 })
        continue
      }

      const tableExpression = toQualifiedTableExpression(tableName)
      await tx.execute(sql`
        insert into ${sql.raw(tableExpression)}
        select *
        from json_populate_recordset(null::${sql.raw(tableExpression)}, ${JSON.stringify(rows)}::json)
      `)

      insertedRows += rows.length
      tableSummaries.push({ table: tableName, rows: rows.length })
    }

    return {
      insertedRows,
      tableCount: currentTables.length,
      tables: tableSummaries,
    }
  })
}

