import { and, desc, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { releaseAnnouncementsTable, releaseAnnouncementViewsTable } from "@/src/db/schema/release"

export async function getLatestReleaseAnnouncement() {
  return db.query.releaseAnnouncements.findFirst({
    orderBy: [desc(releaseAnnouncementsTable.createdAt)],
  })
}

export async function getActiveReleaseAnnouncementForUser(userId: string) {
  const activeRelease = await db.query.releaseAnnouncements.findFirst({
    where: eq(releaseAnnouncementsTable.isActive, true),
    orderBy: [desc(releaseAnnouncementsTable.createdAt)],
  })

  if (!activeRelease) {
    return null
  }

  const view = await db.query.releaseAnnouncementViews.findFirst({
    where: and(
      eq(releaseAnnouncementViewsTable.releaseAnnouncementId, activeRelease.id),
      eq(releaseAnnouncementViewsTable.userId, userId)
    ),
  })

  if (view) {
    return null
  }

  return activeRelease
}

export async function markReleaseAnnouncementSeen(releaseAnnouncementId: string, userId: string) {
  await db
    .insert(releaseAnnouncementViewsTable)
    .values({
      id: crypto.randomUUID(),
      releaseAnnouncementId,
      userId,
      viewedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [releaseAnnouncementViewsTable.releaseAnnouncementId, releaseAnnouncementViewsTable.userId],
    })
}

