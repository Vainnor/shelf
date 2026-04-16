import { inArray } from "drizzle-orm"
import { ArrowLeft, ClipboardList } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema/user"
import { listAuditLogs } from "@/src/lib/audit"
import { requireAdminUser } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminAuditPage() {
  await requireAdminUser()

  const logs = await listAuditLogs({ limit: 150 })
  const actorIds = Array.from(new Set(logs.map((log) => log.actorUserId).filter(Boolean))) as string[]
  const actors = actorIds.length
    ? await db.query.user.findMany({ where: inArray(usersTable.id, actorIds) })
    : []
  const actorById = new Map(actors.map((actor) => [actor.id, actor]))

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit gap-1.5">
              <ClipboardList className="size-3.5" />
              Admin
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Audit logs</h1>
            <p className="text-muted-foreground">Recent administrative and moderation events.</p>
          </div>
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}>
            <ArrowLeft className="size-4" />
            Back to admin
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
            <CardDescription>{logs.length} latest events from audit logging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs yet.</p>
            ) : (
              logs.map((row) => {
                const actor = row.actorUserId ? actorById.get(row.actorUserId) : null
                return (
                <div key={row.id} className="space-y-1 rounded-md border border-border/70 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{row.scope}</Badge>
                    <span>{row.createdAt.toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium">{row.action}</p>
                  <p className="text-xs text-muted-foreground">
                    Actor: {actor?.name ?? actor?.email ?? row.actorUserId ?? "system"}
                  </p>
                  {row.targetType || row.targetId ? (
                    <p className="text-xs text-muted-foreground">
                      Target: {row.targetType ?? "n/a"} {row.targetId ? `(${row.targetId})` : ""}
                    </p>
                  ) : null}
                  {row.metadata ? (
                    <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px] leading-relaxed">
                      {JSON.stringify(row.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

