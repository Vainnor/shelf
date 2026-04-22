"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import { releaseAnnouncementsTable } from "@/src/db/schema/release"
import { writeAuditLog } from "@/src/lib/audit"
import { getActiveReleaseAnnouncementForUser, markReleaseAnnouncementSeen } from "@/src/lib/release-announcements"
import { requireAdminUser, requireAuthenticatedUser } from "@/src/lib/admin"

function parseImageUrls(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export async function upsertReleaseAnnouncementByAdmin(formData: FormData) {
  const { user } = await requireAdminUser()

  const versionKey = String(formData.get("versionKey") ?? "").trim()
  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const releaseLink = String(formData.get("releaseLink") ?? "").trim() || null
  const imageUrlsRaw = String(formData.get("imageUrls") ?? "")
  const isActive = String(formData.get("isActive") ?? "false") === "true"

  if (!versionKey || !title || !body) {
    throw new Error("Version key, title, and body are required")
  }

  if (isActive) {
    await db
      .update(releaseAnnouncementsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(releaseAnnouncementsTable.isActive, true))
  }

  const [announcement] = await db
    .insert(releaseAnnouncementsTable)
    .values({
      id: crypto.randomUUID(),
      versionKey,
      title,
      body,
      releaseLink,
      imageUrls: parseImageUrls(imageUrlsRaw),
      isActive,
    })
    .onConflictDoUpdate({
      target: releaseAnnouncementsTable.versionKey,
      set: {
        title,
        body,
        releaseLink,
        imageUrls: parseImageUrls(imageUrlsRaw),
        isActive,
        updatedAt: new Date(),
      },
    })
    .returning()

  await writeAuditLog({
    actorUserId: user.id,
    scope: "admin",
    action: "release_announcement.upserted",
    targetType: "release_announcement",
    targetId: announcement?.id ?? versionKey,
    metadata: {
      versionKey,
      isActive,
      imageCount: parseImageUrls(imageUrlsRaw).length,
      hasReleaseLink: Boolean(releaseLink),
    },
  })

  revalidatePath("/admin")
  revalidatePath("/dashboard")
  revalidatePath("/library")
}

export async function markCurrentReleaseAnnouncementSeen(formData: FormData) {
  const { user } = await requireAuthenticatedUser()
  const releaseId = String(formData.get("releaseId") ?? "").trim()

  if (!releaseId) {
    return
  }

  await markReleaseAnnouncementSeen(releaseId, user.id)
  revalidatePath("/dashboard")
  revalidatePath("/library")
}

export async function getActiveReleaseAnnouncementForViewer() {
  const { user } = await requireAuthenticatedUser()
  return getActiveReleaseAnnouncementForUser(user.id)
}

