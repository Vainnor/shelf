import { sql } from "drizzle-orm"

import PageHeader from "@/src/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { db } from "@/src/db"
import { requireAdminUser } from "@/src/lib/admin"
import FullBackupTools from "@/src/components/admin/full-backup-tools"

export const dynamic = "force-dynamic"

export default async function AdminBackupPage() {
  await requireAdminUser()

  const [usersResult, booksResult] = await Promise.all([
    db.execute(sql`select count(*)::int as count from "users"`),
    db.execute(sql`select count(*)::int as count from "books"`),
  ])

  const users = Number((usersResult.rows[0] as { count: number } | undefined)?.count ?? 0)
  const books = Number((booksResult.rows[0] as { count: number } | undefined)?.count ?? 0)

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="Backup helper"
          description="Operational notes for export and restore on self-hosted deployments."
          breadcrumbCurrentLabel="Backup"
        />

        <Card>
          <CardHeader>
            <CardTitle>Current footprint</CardTitle>
            <CardDescription>Quick estimate before generating backups.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <p className="text-sm"><span className="font-medium">Users:</span> {users}</p>
            <p className="text-sm"><span className="font-medium">Books:</span> {books}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended backup flow</CardTitle>
            <CardDescription>Use your Postgres tooling from the host environment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1) Create a compressed database dump with pg_dump.</p>
            <pre className="overflow-x-auto rounded bg-muted/40 p-3 text-[11px] text-foreground">
{`pg_dump --format=custom --no-owner --no-privileges --file=shelf.backup "$DATABASE_URL"`}
            </pre>
            <p>2) Store the backup off-host (S3, object storage, encrypted volume).</p>
            <p>3) Test restore in a staging database before production restore.</p>
            <pre className="overflow-x-auto rounded bg-muted/40 p-3 text-[11px] text-foreground">
{`createdb shelf_restore_test\npg_restore --clean --if-exists --no-owner --dbname=shelf_restore_test shelf.backup`}
            </pre>
            <p>
              Keep backup files encrypted at rest and rotate retention according to your policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In-app full backup transfer</CardTitle>
            <CardDescription>
              Export the complete application database as JSON and import it into another instance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FullBackupTools />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
