"use server"

import { auth } from "@/src/lib/auth"
import { getSystemSettings } from "@/src/lib/admin"
import { getActiveSession } from "@/src/lib/session"

export async function getSession() {
  try {
    const activeSession = await getActiveSession()
    if (!activeSession) {
      return null
    }

    return {
      ...activeSession.session,
      user: {
        ...activeSession.session.user,
        name: activeSession.user.name ?? undefined,
        email: activeSession.user.email,
        image: activeSession.user.image,
        role: activeSession.user.role,
      },
    }
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}

export async function signUpWithEmail(input: { name: string; email: string; password: string }) {
  const settings = await getSystemSettings()

  if (!settings.bootstrapCompleted) {
    throw new Error("Admin setup must be completed first")
  }

  if (!settings.signupsEnabled) {
    throw new Error("Public signups are currently disabled")
  }

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (!name || !email || password.length < 8) {
    throw new Error("Provide a valid name, email, and password")
  }

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  })

  if (!result?.user?.id) {
    throw new Error("Failed to create account")
  }

  return { ok: true }
}

