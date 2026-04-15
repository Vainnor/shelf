"use server"

import { headers } from "next/headers"
import { auth } from "@/src/lib/auth"

export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    return session
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}

