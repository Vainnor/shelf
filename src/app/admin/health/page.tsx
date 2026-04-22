import { promises as fs } from "node:fs"
import path from "node:path"

import { sql } from "drizzle-orm"

import EmailDiagnosticsCard from "@/src/components/admin/email-diagnostics-card"
import PageHeader from "@/src/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { db } from "@/src/db"
import { requireAdminUser } from "@/src/lib/admin"
import { getEmailDiagnostics } from "@/src/lib/email"

export const dynamic = "force-dynamic"

type JournalEntry = { idx: number }

async function getExpectedMigrationCount() {
  const journalPath = path.join(process.cwd(), "drizzle/meta/_journal.json")
  const raw = await fs.readFile(journalPath, "utf8")
  const parsed = JSON.parse(raw) as { entries?: JournalEntry[] }
  return parsed.entries?.length ?? 0
}

async function getAppliedMigrationCount() {
  const tableCheck = await db.execute(
    sql`select to_regclass('public.__drizzle_migrations') as table_name`
  )
  const tableName = (tableCheck.rows[0] as { table_name: string | null } | undefined)?.table_name
  if (!tableName) {
    return null
  }

  const result = await db.execute(sql`select count(*)::int as count from "__drizzle_migrations"`)
  const row = result.rows[0] as { count: number }
  return row?.count ?? 0
}

async function hasAuditLogsTable() {
  const result = await db.execute(sql`select to_regclass('public.audit_logs') as table_name`)
  return Boolean((result.rows[0] as { table_name: string | null } | undefined)?.table_name)
}

async function userRoleEnumIncludes(values: string[]) {
  const result = await db.execute(sql`
    select e.enumlabel
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'user_role'
  `)

  const labels = new Set(result.rows.map((row) => String((row as { enumlabel: string }).enumlabel)))
  return values.every((value) => labels.has(value))
}

async function hasUserReminderColumns() {
  const result = await db.execute(sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name in ('reading_reminder_enabled', 'reading_reminder_channel', 'reading_reminder_days')
  `)

  const found = new Set(
    result.rows.map((row) => String((row as { column_name: string }).column_name))
  )

  return (
    found.has("reading_reminder_enabled") &&
    found.has("reading_reminder_channel") &&
    found.has("reading_reminder_days")
  )
}

export default async function AdminHealthPage() {
  const { user: adminUser } = await requireAdminUser()
  const emailDiagnostics = getEmailDiagnostics()

  const checkedAt = new Date()

  let dbHealthy = false
  let dbMessage = "Unknown"
  try {
    await db.execute(sql`select 1`)
    dbHealthy = true
    dbMessage = "Database responded to SELECT 1"
  } catch (error) {
    dbMessage = error instanceof Error ? error.message : "Database check failed"
  }

  let expectedMigrations = 0
  let appliedMigrations = 0
  let migrationTableMissing = false
  let migrationsMessage = "Unavailable"
  let fallbackSchemaLooksCurrent = false
  try {
    expectedMigrations = await getExpectedMigrationCount()
    const appliedCount = await getAppliedMigrationCount()

    if (appliedCount === null) {
      migrationTableMissing = true
      const [auditLogsReady, rolesReady, reminderColumnsReady] = await Promise.all([
        hasAuditLogsTable(),
        userRoleEnumIncludes(["editor", "moderator"]),
        hasUserReminderColumns(),
      ])
      fallbackSchemaLooksCurrent = auditLogsReady && rolesReady && reminderColumnsReady
      appliedMigrations = fallbackSchemaLooksCurrent ? expectedMigrations : 0
      migrationsMessage = fallbackSchemaLooksCurrent
        ? "Migration history table not found, but schema looks current (likely provisioned via drizzle push)."
        : "Migration history table not found and schema is missing recent objects. Run migrations to initialize tracking."
    } else {
      appliedMigrations = appliedCount
      migrationsMessage = `${appliedMigrations} applied / ${expectedMigrations} expected`
    }
  } catch (error) {
    migrationsMessage = error instanceof Error ? error.message : "Unable to read migration state"
  }

  const migrationsHealthy =
    (migrationTableMissing && fallbackSchemaLooksCurrent) ||
    (!migrationTableMissing && expectedMigrations > 0 && appliedMigrations >= expectedMigrations)

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="System health"
          description="Operational checks for this deployment."
          breadcrumbCurrentLabel="Health"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Database</CardTitle>
              <CardDescription>{dbHealthy ? "Healthy" : "Degraded"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{dbMessage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Migrations</CardTitle>
              <CardDescription>{migrationsHealthy ? "Aligned" : "Review needed"}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{migrationsMessage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queue jobs</CardTitle>
              <CardDescription>Not configured</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No queue worker integration is currently wired in this project.
              </p>
            </CardContent>
          </Card>
        </div>

        <EmailDiagnosticsCard diagnostics={emailDiagnostics} adminEmail={adminUser.email} />

        <Card>
          <CardHeader>
            <CardTitle>Last check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{checkedAt.toLocaleString()}</p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
