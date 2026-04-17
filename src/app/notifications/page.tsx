import { ArrowLeft, Bell } from "lucide-react"
import Link from "next/link"

import {
  deleteNotificationFromForm,
  deleteReadNotificationsAction,
  getNotifications,
  markAllNotificationsAsReadAction,
  markNotificationAsReadFromForm,
} from "@/src/actions/notifications"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import ConfirmDeleteSubmitButton from "@/src/components/ui/confirm-delete-submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { requireAuthenticatedUser } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  async function markAllFromForm(_formData: FormData) {
    "use server"
    void _formData
    await markAllNotificationsAsReadAction()
  }

  async function deleteReadFromForm(_formData: FormData) {
    "use server"
    void _formData
    await deleteReadNotificationsAction()
  }

  async function markSingleFromForm(formData: FormData) {
    "use server"
    await markNotificationAsReadFromForm(formData)
  }

  async function deleteSingleFromForm(formData: FormData) {
    "use server"
    await deleteNotificationFromForm(formData)
  }

  await requireAuthenticatedUser()
  const notifications = await getNotifications(200)

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <Bell className="size-3.5" />
              Notifications
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Your notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                : "You are all caught up."}
            </p>
          </div>

          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage notifications</CardTitle>
            <CardDescription>Mark as read or delete notifications you no longer need.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <form action={markAllFromForm}>
              <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Mark all as read
              </button>
            </form>
            <form action={deleteReadFromForm}>
              <ConfirmDeleteSubmitButton label="Delete read notifications" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Newest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "space-y-2 rounded-md border border-border/70 p-3",
                    !notification.isRead && "bg-muted/30"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!notification.isRead ? <Badge variant="secondary">Unread</Badge> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {notification.href ? (
                      <Link href={notification.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                        Open
                      </Link>
                    ) : null}

                    {!notification.isRead ? (
                      <form action={markSingleFromForm}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                          Mark as read
                        </button>
                      </form>
                    ) : null}

                    <form action={deleteSingleFromForm}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <ConfirmDeleteSubmitButton label="Delete" />
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

