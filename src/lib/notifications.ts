import { and, desc, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { notificationsTable } from "@/src/db/schema/reading"

export const notificationKinds = [
  "info",
  "reading.reminder",
  "recommendation.feedback",
] as const

export type NotificationKind = (typeof notificationKinds)[number]

type BaseNotificationPayload = {
  userId: string
  href?: string | null
}

export type ReadingReminderNotificationPayload = BaseNotificationPayload & {
  kind: "reading.reminder"
  bookTitle: string
  daysInactive: number
}

export type RecommendationFeedbackNotificationPayload = BaseNotificationPayload & {
  kind: "recommendation.feedback"
  recommendationTitle: string
  feedbackType: "not_interested" | "already_read"
}

export type NotificationPayload =
  | ReadingReminderNotificationPayload
  | RecommendationFeedbackNotificationPayload

export type CreateNotificationInput = {
  userId: string
  type?: string
  title: string
  body: string
  href?: string | null
}

function toNotificationContent(payload: NotificationPayload): Pick<CreateNotificationInput, "type" | "title" | "body" | "href"> {
  if (payload.kind === "reading.reminder") {
    return {
      type: payload.kind,
      title: `Time to pick up ${payload.bookTitle}`,
      body: `You have not logged progress in ${payload.daysInactive} day(s).`,
      href: payload.href ?? "/dashboard",
    }
  }

  return {
    type: payload.kind,
    title: "Recommendation feedback saved",
    body:
      payload.feedbackType === "already_read"
        ? `${payload.recommendationTitle} was marked as already read.`
        : `${payload.recommendationTitle} was marked as not interested.`,
    href: payload.href ?? "/dashboard",
  }
}

export async function createNotification(input: CreateNotificationInput) {
  const [created] = await db
    .insert(notificationsTable)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.type ?? "info",
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })
    .returning()

  return created
}

export async function createTypedNotification(payload: NotificationPayload) {
  const content = toNotificationContent(payload)
  return createNotification({
    userId: payload.userId,
    ...content,
  })
}

export async function listNotificationsForUser(userId: string, limit = 100) {
  return db.query.notifications.findMany({
    where: eq(notificationsTable.userId, userId),
    orderBy: [desc(notificationsTable.createdAt)],
    limit: Math.min(Math.max(limit, 1), 250),
  })
}

export async function getUnreadNotificationsCount(userId: string) {
  const unread = await db.query.notifications.findMany({
    where: and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)),
    columns: { id: true },
  })

  return unread.length
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const [updated] = await db
    .update(notificationsTable)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, userId)))
    .returning()

  return updated
}

export async function markAllNotificationsAsRead(userId: string) {
  await db
    .update(notificationsTable)
    .set({
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)))
}

export async function deleteNotification(userId: string, notificationId: string) {
  const [deleted] = await db
    .delete(notificationsTable)
    .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, userId)))
    .returning({ id: notificationsTable.id })

  return deleted
}

export async function deleteReadNotifications(userId: string) {
  await db
    .delete(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, true)))
}

