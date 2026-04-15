import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { db } from "@/src/db"
import { systemSettingsTable } from "@/src/db/schema/system"
import { getActiveSession } from "@/src/lib/session"

const SYSTEM_SETTINGS_ID = "default"

export async function ensureSystemSettingsRow() {
  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettingsTable.id, SYSTEM_SETTINGS_ID),
  })

  if (existing) {
    return existing
  }

  const [created] = await db
    .insert(systemSettingsTable)
    .values({ id: SYSTEM_SETTINGS_ID })
    .onConflictDoNothing({ target: systemSettingsTable.id })
    .returning()

  if (created) {
    return created
  }

  const fallback = await db.query.systemSettings.findFirst({
    where: eq(systemSettingsTable.id, SYSTEM_SETTINGS_ID),
  })

  if (!fallback) {
    throw new Error("Failed to initialize system settings")
  }

  return fallback
}

export async function getSystemSettings() {
  return ensureSystemSettingsRow()
}

export async function requireAuthenticatedUser() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    redirect("/login")
  }

  return activeSession
}

export async function requireAdminUser() {
  const { session, user } = await requireAuthenticatedUser()

  if (user.role !== "admin") {
    redirect("/dashboard")
  }

  return { session, user }
}

export async function isBootstrapCompleted() {
  const settings = await getSystemSettings()
  return settings.bootstrapCompleted
}

