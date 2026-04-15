"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import { systemSettingsTable } from "@/src/db/schema/system"
import { sessionsTable } from "@/src/db/schema/user"
import { usersTable } from "@/src/db/schema/user"
import { auth } from "@/src/lib/auth"
import { getSystemSettings, requireAdminUser } from "@/src/lib/admin"

function requireId(value: FormDataEntryValue | null, field: string) {
  const id = String(value ?? "").trim()
  if (!id) {
    throw new Error(`${field} is required`)
  }
  return id
}

export async function updateUserByAdmin(formData: FormData) {
  const { user: adminUser } = await requireAdminUser()

  const userId = requireId(formData.get("userId"), "User ID")
  const name = String(formData.get("name") ?? "").trim() || null
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  if (!email) {
    throw new Error("Email is required")
  }

  const existingByEmail = await db.query.user.findFirst({
    where: and(eq(usersTable.email, email), ne(usersTable.id, userId)),
  })

  if (existingByEmail) {
    throw new Error("Email is already used by another account")
  }

  await db
    .update(usersTable)
    .set({ name, email, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))

  revalidatePath("/admin")
  revalidatePath("/admin/users/[id]", "page")

  if (adminUser.id === userId) {
    revalidatePath("/profile")
  }
}

export async function toggleUserDisabledByAdmin(formData: FormData) {
  const { user: adminUser } = await requireAdminUser()
  const userId = requireId(formData.get("userId"), "User ID")

  if (userId === adminUser.id) {
    throw new Error("You cannot disable your own account")
  }

  const targetUser = await db.query.user.findFirst({
    where: eq(usersTable.id, userId),
  })

  if (!targetUser) {
    throw new Error("User not found")
  }

  await db
    .update(usersTable)
    .set({ isDisabled: !targetUser.isDisabled, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))

  if (!targetUser.isDisabled) {
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId))
  }

  revalidatePath("/admin")
}

export async function deleteUserByAdmin(formData: FormData) {
  const { user: adminUser } = await requireAdminUser()
  const userId = requireId(formData.get("userId"), "User ID")

  if (adminUser.id === userId) {
    throw new Error("You cannot delete your own account")
  }

  const targetUser = await db.query.user.findFirst({
    where: eq(usersTable.id, userId),
  })

  if (!targetUser) {
    throw new Error("User not found")
  }

  if (targetUser.role === "admin") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"))

    if (count <= 1) {
      throw new Error("Cannot delete the last admin account")
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId))
  revalidatePath("/admin")
}

export async function sendPasswordResetByAdmin(formData: FormData) {
  await requireAdminUser()

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!email) {
    throw new Error("Email is required")
  }

  await auth.api.requestPasswordReset({
    body: {
      email,
      redirectTo: "/login",
    },
  })

  revalidatePath("/admin")
}

export async function setSignupsEnabledByAdmin(formData: FormData) {
  await requireAdminUser()
  await getSystemSettings()
  const enabled = String(formData.get("enabled") ?? "false") === "true"

  await db
    .update(systemSettingsTable)
    .set({ signupsEnabled: enabled, updatedAt: new Date() })
    .where(eq(systemSettingsTable.id, "default"))

  revalidatePath("/admin")
  revalidatePath("/signup")
}


