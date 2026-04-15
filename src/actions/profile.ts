"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { usersTable } from "@/src/db/schema/user"
import { requireAuthenticatedUser } from "@/src/lib/admin"

export type ProfileActionState = {
  ok: boolean
  message: string
}

export type ProfileSummary = {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: "user" | "admin"
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }
  stats: {
    totalBooks: number
    toRead: number
    reading: number
    read: number
  }
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  const { user } = await requireAuthenticatedUser()

  const books = await db.query.books.findMany({
    where: eq(booksTable.userId, user.id),
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    stats: {
      totalBooks: books.length,
      toRead: books.filter((book) => book.status === "to_read").length,
      reading: books.filter((book) => book.status === "reading").length,
      read: books.filter((book) => book.status === "read").length,
    },
  }
}

export async function updateCurrentUserAvatarUrl(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const imageUrl = String(formData.get("imageUrl") ?? "").trim()

    if (!imageUrl) {
      return { ok: false, message: "Please provide an image URL." }
    }

    if (!isValidHttpUrl(imageUrl)) {
      return { ok: false, message: "Avatar URL must start with http:// or https://" }
    }

    await db
      .update(usersTable)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    revalidatePath("/library")

    return { ok: true, message: "Avatar updated." }
  } catch (error) {
    console.error("Error updating avatar URL:", error)
    return { ok: false, message: "Failed to update avatar." }
  }
}

export async function clearCurrentUserAvatar(
  _prevState: ProfileActionState
): Promise<ProfileActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()

    await db
      .update(usersTable)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    revalidatePath("/library")

    return { ok: true, message: "Avatar removed." }
  } catch (error) {
    console.error("Error clearing avatar:", error)
    return { ok: false, message: "Failed to remove avatar." }
  }
}

