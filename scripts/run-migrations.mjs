import { spawnSync } from "node:child_process"

import pg from "pg"

const { Client } = pg

const requiredSchemaChecks = [
  { kind: "column", table: "users", column: "username" },
  { kind: "column", table: "users", column: "public_profile_enabled" },
  { kind: "column", table: "book_club_posts", column: "title" },
  { kind: "column", table: "book_club_posts", column: "is_announcement" },
  { kind: "column", table: "book_club_posts", column: "updated_at" },
  { kind: "column", table: "book_club_posts", column: "edited_at" },
  { kind: "column", table: "users", column: "reading_reminder_enabled" },
  { kind: "column", table: "users", column: "reading_reminder_channel" },
  { kind: "column", table: "users", column: "reading_reminder_days" },
  { kind: "column", table: "users", column: "public_show_highlights" },
  { kind: "column", table: "users", column: "public_highlights_limit" },
]

async function hasRelation(client, relationName) {
  const result = await client.query("select to_regclass($1) as name", [relationName])
  return Boolean(result.rows[0]?.name)
}

async function hasColumn(client, tableName, columnName) {
  const result = await client.query(
    `select 1
     from information_schema.columns
     where table_schema = 'public'
       and table_name = $1
       and column_name = $2
     limit 1`,
    [tableName, columnName]
  )

  return result.rowCount > 0
}

async function schemaIsReady(client) {
  for (const check of requiredSchemaChecks) {
    if (check.kind === "column") {
      // eslint-disable-next-line no-await-in-loop
      const exists = await hasColumn(client, check.table, check.column)
      if (!exists) return false
    }
  }

  return true
}

function runDrizzleCommand(mode, force = false) {
  const args = ["drizzle-kit", mode, "--config", "drizzle.config.ts"]
  if (force) {
    args.push("--force")
  }

  return spawnSync("pnpm", args, {
    stdio: "inherit",
    env: process.env,
  })
}

async function selectMigrationMode() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations")
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    const hasMigrationsTable = await hasRelation(client, "__drizzle_migrations")
    const hasUsersTable = await hasRelation(client, "users")

    if (!hasUsersTable) {
      return "migrate"
    }

    return hasMigrationsTable ? "migrate" : "push"
  } finally {
    await client.end()
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations")
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  let mode = await selectMigrationMode()
  console.log(`[migrations] Selected mode: ${mode}`)

  let result = runDrizzleCommand(mode)

  if (result.status !== 0) {
    console.warn(`[migrations] ${mode} failed, trying forced push fallback`)
    mode = "push"
    result = runDrizzleCommand(mode, true)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  const ready = await schemaIsReady(client)
  await client.end()

  if (!ready) {
    console.warn("[migrations] schema verification failed, retrying forced push")
    const retry = runDrizzleCommand("push", true)
    process.exit(retry.status ?? 1)
  }

  process.exit(0)
}

main().catch((error) => {
  console.error("[migrations] Failed to run migrations", error)
  process.exit(1)
})

