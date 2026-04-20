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

type NotificationFamily = "all" | "reading" | "admin" | "general"

type NotificationsPageProps = {
  searchParams?: Promise<{
    type?: string
    unread?: string
  }>
}

type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number]

function getNotificationFamily(type: string): Exclude<NotificationFamily, "all"> {
  if (type.startsWith("reading.") || type.startsWith("recommendation.")) return "reading"
  if (type.startsWith("admin.") || type.startsWith("backup.") || type.startsWith("system.")) return "admin"
  return "general"
}

function describeNotification(notification: NotificationItem) {
  const family = getNotificationFamily(notification.type)

  if (notification.type === "reading.reminder") {
    return {
      familyLabel: "Reading",
      eventLabel: "Reminder",
      actionLabel: "Resume reading",
      title: notification.title,
      body: notification.body,
      family,
    }
  }

  if (notification.type === "recommendation.feedback") {
    return {
      familyLabel: "Reading",
      eventLabel: "Recommendation",
      actionLabel: "Open dashboard",
      title: notification.title,
      body: notification.body,
      family,
    }
  }

  if (family === "admin") {
    return {
      familyLabel: "Admin",
      eventLabel: "Operations",
      actionLabel: "Open admin",
      title: notification.title,
      body: notification.body,
      family,
    }
  }

  if (family === "reading") {
    return {
      familyLabel: "Reading",
      eventLabel: "Update",
      actionLabel: "Open reading",
      title: notification.title,
      body: notification.body,
      family,
    }
  }

  return {
    familyLabel: "General",
    eventLabel: "Info",
    actionLabel: "Open",
    title: notification.title,
    body: notification.body,
    family,
  }
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
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
  const params = (await searchParams) ?? {}
  const selectedType: NotificationFamily =
    params.type === "reading" ||
    params.type === "admin" ||
    params.type === "general"
      ? params.type
      : "all"
  const unreadOnly = params.unread === "1"

  const notifications = await getNotifications(200)
  const filteredNotifications = notifications.filter((notification) => {
    if (selectedType !== "all" && getNotificationFamily(notification.type) !== selectedType) {
      return false
    }

    if (unreadOnly) {
      return !notification.isRead
    }

    return true
  })

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
            <CardDescription>Mark as read, delete old items, and filter noise by type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <select
                name="type"
                defaultValue={selectedType}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">All types</option>
                <option value="reading">Reading</option>
                <option value="admin">Admin</option>
                <option value="general">General</option>
              </select>
              <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <input type="checkbox" name="unread" value="1" defaultChecked={unreadOnly} className="size-4" />
                Unread only
              </label>
              <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}>
                Apply
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <form action={markAllFromForm}>
                <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Mark all as read
                </button>
              </form>
              <form action={deleteReadFromForm}>
                <ConfirmDeleteSubmitButton label="Delete read notifications" />
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              Newest first. Showing {filteredNotifications.length} of {notifications.length} notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {notifications.length === 0 ? "No notifications yet." : "No notifications match current filters."}
              </p>
            ) : (
              filteredNotifications.map((notification) => {
                const view = describeNotification(notification)
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "space-y-2 rounded-md border border-border/70 p-3",
                      !notification.isRead && "bg-muted/30"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{view.familyLabel}</Badge>
                          <Badge variant="outline">{view.eventLabel}</Badge>
                          {!notification.isRead ? <Badge variant="secondary">Unread</Badge> : null}
                        </div>
                        <p className="text-sm font-medium">{view.title}</p>
                        <p className="text-sm text-muted-foreground">{view.body}</p>
                        <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {notification.href ? (
                        <Link href={notification.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                          {view.actionLabel}
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
                )
              })
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

