import { sql } from "drizzle-orm"
import { Activity, ArrowLeft, DatabaseBackup, ShieldUser } from "lucide-react"
import Link from "next/link"

import {
  deleteUserByAdmin,
  sendPasswordResetByAdmin,
  setSignupsEnabledByAdmin,
  toggleUserDisabledByAdmin,
} from "@/src/actions/admin-users"
import { upsertReleaseAnnouncementByAdmin } from "@/src/actions/release-announcements"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import ConfirmDeleteSubmitButton from "@/src/components/ui/confirm-delete-submit-button"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import SeedControls from "@/src/components/admin/seed-controls"
import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { getSystemSettings, requireAdminUser } from "@/src/lib/admin"
import { getLatestReleaseAnnouncement } from "@/src/lib/release-announcements"
import { cn } from "@/src/lib/utils"

export default async function AdminPage() {
  const { user: adminUser } = await requireAdminUser()
  const settings = await getSystemSettings()
  const latestRelease = await getLatestReleaseAnnouncement()

  const users = await db.query.user.findMany({
    orderBy: (user, { desc }) => [desc(user.createdAt)],
  })

  const counts = await db
    .select({ userId: booksTable.userId, count: sql<number>`count(*)::int` })
    .from(booksTable)
    .groupBy(booksTable.userId)

  const bookCounts = new Map(counts.map((row) => [row.userId, row.count]))

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit gap-1.5">
              <ShieldUser className="size-3.5" />
              Admin
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
            <p className="text-muted-foreground">Manage users, account access, and signup policy.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
            <NotificationsButton />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Release popup</CardTitle>
            <CardDescription>
              Configure an in-app announcement modal for the next release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertReleaseAnnouncementByAdmin} className="space-y-5">
              <div className="grid gap-4 rounded-lg border border-border/70 bg-muted/20 p-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Version key</span>
                  <input
                    name="versionKey"
                    defaultValue={latestRelease?.versionKey ?? ""}
                    placeholder="v1.2.0"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Release link (optional)</span>
                  <input
                    name="releaseLink"
                    type="url"
                    defaultValue={latestRelease?.releaseLink ?? ""}
                    placeholder="https://github.com/your-org/your-repo/releases/tag/v1.2.0"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Title</span>
                  <input
                    name="title"
                    defaultValue={latestRelease?.title ?? ""}
                    placeholder="What is new in this release"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Body</span>
                  <textarea
                    name="body"
                    defaultValue={latestRelease?.body ?? ""}
                    rows={5}
                    placeholder="Describe new features, bug fixes, and important updates."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Image URLs (one per line)</span>
                  <textarea
                    name="imageUrls"
                    defaultValue={(latestRelease?.imageUrls ?? []).join("\n")}
                    rows={4}
                    placeholder="https://.../screenshot-1.png"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    value="true"
                    defaultChecked={latestRelease?.isActive ?? false}
                    className="size-4"
                  />
                  Make this release announcement active
                </label>
              </div>

              <div className="flex justify-end">
                <button type="submit" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                  Save release popup
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System controls</CardTitle>
            <CardDescription>Global switches for account creation and access policy.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Public signups are currently <span className="font-medium">{settings.signupsEnabled ? "enabled" : "disabled"}</span>.
            </div>
            <form action={setSignupsEnabledByAdmin}>
              <input type="hidden" name="enabled" value={settings.signupsEnabled ? "false" : "true"} />
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: settings.signupsEnabled ? "destructive" : "default", size: "sm" })
                )}
              >
                {settings.signupsEnabled ? "Disable signups" : "Enable signups"}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/admin/audit" className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-2")}>
            <ShieldUser className="size-4" />
            Audit logs
          </Link>
          <Link href="/admin/health" className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-2")}>
            <Activity className="size-4" />
            System health
          </Link>
          <Link href="/admin/backup" className={cn(buttonVariants({ variant: "outline" }), "justify-start gap-2")}>
            <DatabaseBackup className="size-4" />
            Backup helper
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seeder controls</CardTitle>
            <CardDescription>Run demo seed in dry-run/apply/cleanup modes with explicit confirmations.</CardDescription>
          </CardHeader>
          <CardContent>
            <SeedControls />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User accounts</CardTitle>
            <CardDescription>{users.length} users in this deployment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{user.name ?? "Unnamed user"}</p>
                    <Badge variant="outline">{user.role}</Badge>
                    {user.isDisabled ? <Badge variant="destructive">disabled</Badge> : null}
                    {user.id === adminUser.id ? <Badge>you</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Books: {bookCounts.get(user.id) ?? 0} | Joined: {user.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Edit
                  </Link>

                  <form action={sendPasswordResetByAdmin}>
                    <input type="hidden" name="email" value={user.email} />
                    <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Reset password
                    </button>
                  </form>

                  <form action={toggleUserDisabledByAdmin}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className={cn(
                        buttonVariants({ variant: user.isDisabled ? "default" : "secondary", size: "sm" })
                      )}
                    >
                      {user.isDisabled ? "Enable" : "Disable"}
                    </button>
                  </form>

                  <form action={deleteUserByAdmin}>
                    <input type="hidden" name="userId" value={user.id} />
                    <ConfirmDeleteSubmitButton label="Delete" disabled={user.id === adminUser.id} />
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

