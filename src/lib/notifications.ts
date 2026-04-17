import { and, desc, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { notificationsTable } from "@/src/db/schema/reading"

export type CreateNotificationInput = {
  userId: string
  type?: string
  title: string
  body: string
  href?: string | null
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

