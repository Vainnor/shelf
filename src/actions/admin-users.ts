"use server"

import { and, eq, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import { systemSettingsTable } from "@/src/db/schema/system"
import { sessionsTable } from "@/src/db/schema/user"
import { userRoles, type UserRole, usersTable } from "@/src/db/schema/user"
import { auth } from "@/src/lib/auth"
import { writeAuditLog } from "@/src/lib/audit"
import { getSystemSettings, requireAdminUser } from "@/src/lib/admin"

function requireId(value: FormDataEntryValue | null, field: string) {
  const id = String(value ?? "").trim()
  if (!id) {
    throw new Error(`${field} is required`)
  }
  return id
}

function parseUserRole(value: FormDataEntryValue | null, fallbackRole: UserRole): UserRole {
  if (value === null) {
    return fallbackRole
  }

  const role = String(value ?? "").trim() as UserRole
  if (!userRoles.includes(role)) {
    throw new Error("Invalid role")
  }
  return role
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

  const targetUser = await db.query.user.findFirst({ where: eq(usersTable.id, userId) })
  if (!targetUser) {
    throw new Error("User not found")
  }

  const role = parseUserRole(formData.get("role"), targetUser.role)

  if (targetUser.role === "admin" && role !== "admin") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"))

    if (count <= 1) {
      throw new Error("Cannot remove admin role from the last admin account")
    }
  }

  await db
    .update(usersTable)
    .set({ name, email, role, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))

  await writeAuditLog({
    actorUserId: adminUser.id,
    scope: "admin",
    action: "user.updated",
    targetType: "user",
    targetId: userId,
    metadata: {
      previousRole: targetUser.role,
      nextRole: role,
      changedEmail: targetUser.email !== email,
      changedName: targetUser.name !== name,
    },
  })

  revalidatePath("/admin")
  revalidatePath(`/admin/users/${userId}`)

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

  await writeAuditLog({
    actorUserId: adminUser.id,
    scope: "admin",
    action: "user.disabled_toggled",
    targetType: "user",
    targetId: userId,
    metadata: { disabled: !targetUser.isDisabled },
  })

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

  await writeAuditLog({
    actorUserId: adminUser.id,
    scope: "admin",
    action: "user.deleted",
    targetType: "user",
    targetId: userId,
    metadata: { role: targetUser.role, email: targetUser.email },
  })

  revalidatePath("/admin")
}

export async function sendPasswordResetByAdmin(formData: FormData) {
  const { user: adminUser } = await requireAdminUser()

  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  if (!email) {
    throw new Error("Email is required")
  }

  await auth.api.requestPasswordReset({
    body: {
      email,
      redirectTo: "/reset-password",
    },
  })

  await writeAuditLog({
    actorUserId: adminUser.id,
    scope: "admin",
    action: "user.password_reset_requested",
    targetType: "user_email",
    targetId: email,
  })

  revalidatePath("/admin")
}

export async function setSignupsEnabledByAdmin(formData: FormData) {
  const { user: adminUser } = await requireAdminUser()
  await getSystemSettings()
  const enabled = String(formData.get("enabled") ?? "false") === "true"

  await db
    .update(systemSettingsTable)
    .set({ signupsEnabled: enabled, updatedAt: new Date() })
    .where(eq(systemSettingsTable.id, "default"))

  await writeAuditLog({
    actorUserId: adminUser.id,
    scope: "admin",
    action: "system.signups_updated",
    targetType: "system_settings",
    targetId: "default",
    metadata: { signupsEnabled: enabled },
  })

  revalidatePath("/admin")
  revalidatePath("/signup")
}


