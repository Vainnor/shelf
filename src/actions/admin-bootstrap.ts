"use server"

import { eq } from "drizzle-orm"

import { db } from "@/src/db"
import { systemSettingsTable } from "@/src/db/schema/system"
import { usersTable } from "@/src/db/schema/user"
import { auth } from "@/src/lib/auth"
import { getSystemSettings } from "@/src/lib/admin"

export async function createInitialAdmin(formData: FormData) {
  const settings = await getSystemSettings()
  if (settings.bootstrapCompleted) {
    throw new Error("Admin bootstrap has already been completed")
  }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!name) {
    throw new Error("Name is required")
  }

  if (!email) {
    throw new Error("Email is required")
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  const existing = await db.query.user.findFirst({
    where: eq(usersTable.email, email),
  })

  if (existing) {
    throw new Error("A user with this email already exists")
  }

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  })

  const createdUserId = result?.user?.id
  if (!createdUserId) {
    throw new Error("Failed to create initial admin account")
  }

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(usersTable.id, createdUserId))

    await tx
      .update(systemSettingsTable)
      .set({ bootstrapCompleted: true, updatedAt: new Date() })
      .where(eq(systemSettingsTable.id, "default"))
  })

  return { ok: true }
}

