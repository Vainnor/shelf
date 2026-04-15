"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { auth } from "@/src/lib/auth"
import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { usersTable } from "@/src/db/schema/user"
import { requireAuthenticatedUser } from "@/src/lib/admin"

export type SettingsActionState = {
  ok: boolean
  message: string
  dataJson?: string
  deleted?: boolean
}

export async function updateCurrentUserSettings(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const name = String(formData.get("name") ?? "").trim() || null
    const email = String(formData.get("email") ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return { ok: false, message: "Please provide a valid email address." }
    }

    const existing = await db.query.user.findFirst({
      where: and(eq(usersTable.email, email), ne(usersTable.id, user.id)),
    })

    if (existing) {
      return { ok: false, message: "That email is already in use by another account." }
    }

    await db
      .update(usersTable)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))

    revalidatePath("/settings")
    revalidatePath("/profile")
    revalidatePath("/dashboard")

    return { ok: true, message: "Account details updated." }
  } catch (error) {
    console.error("Error updating current user settings:", error)
    return { ok: false, message: "Failed to update account details." }
  }
}

export async function sendCurrentUserPasswordReset(
  _prevState: SettingsActionState
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()

    await auth.api.requestPasswordReset({
      body: {
        email: user.email,
        redirectTo: "/login",
      },
    })

    return {
      ok: true,
      message: "Password reset email sent. Check your inbox.",
    }
  } catch (error) {
    console.error("Error sending current user password reset:", error)
    return { ok: false, message: "Failed to send password reset email." }
  }
}

export async function exportCurrentUserData(
  _prevState: SettingsActionState
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()

    const books = await db.query.books.findMany({
      where: eq(booksTable.userId, user.id),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
    })

    const payload = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      books,
      stats: {
        totalBooks: books.length,
        toRead: books.filter((book) => book.status === "to_read").length,
        reading: books.filter((book) => book.status === "reading").length,
        read: books.filter((book) => book.status === "read").length,
      },
    }

    return {
      ok: true,
      message: "Data export generated.",
      dataJson: JSON.stringify(payload, null, 2),
    }
  } catch (error) {
    console.error("Error exporting current user data:", error)
    return { ok: false, message: "Failed to export account data." }
  }
}

export async function deleteCurrentUserAccount(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    void _prevState
    const { user } = await requireAuthenticatedUser()
    const confirmText = String(formData.get("confirmText") ?? "").trim()

    if (confirmText !== "DELETE") {
      return { ok: false, message: "Type DELETE to confirm account deletion." }
    }

    if (user.role === "admin") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"))

      if (count <= 1) {
        return {
          ok: false,
          message: "You cannot delete the last admin account.",
        }
      }
    }

    await db.delete(usersTable).where(eq(usersTable.id, user.id))

    revalidatePath("/")
    revalidatePath("/login")
    revalidatePath("/signup")

    return {
      ok: true,
      message: "Your account has been deleted.",
      deleted: true,
    }
  } catch (error) {
    console.error("Error deleting current user account:", error)
    return { ok: false, message: "Failed to delete account." }
  }
}

