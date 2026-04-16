import { ArrowLeft, DatabaseBackup } from "lucide-react"
import Link from "next/link"
import { sql } from "drizzle-orm"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { db } from "@/src/db"
import { requireAdminUser } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit gap-1.5">
              <DatabaseBackup className="size-3.5" />
              Admin
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Backup helper</h1>
            <p className="text-muted-foreground">Operational notes for export and restore on self-hosted deployments.</p>
          </div>
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}>
            <ArrowLeft className="size-4" />
            Back to admin
          </Link>
        </div>

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
      </section>
    </main>
  )
}

