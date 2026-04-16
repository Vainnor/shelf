import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/src/db"
import { sessionsTable, usersTable } from "@/src/db/schema/user"
import { auth } from "@/src/lib/auth"

export async function getActiveSession() {
  const requestHeaders = await headers()

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  try {
    session = await auth.api.getSession({
      headers: requestHeaders,
    })
  } catch (error) {
    console.error("Failed to get session. Ensure latest DB schema/migrations are applied.", error)
    return null
  }

  if (!session) {
    return null
  }

  let user: Awaited<ReturnType<typeof db.query.user.findFirst>> | undefined
  try {
    user = await db.query.user.findFirst({
      where: eq(usersTable.id, session.user.id),
    })
  } catch (error) {
    console.error("Failed to load session user from DB.", error)
    return null
  }

  if (!user || user.isDisabled) {
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, session.user.id))

    try {
      await auth.api.signOut({
        headers: requestHeaders,
      })
    } catch {
      // A stale session token may already be invalid; deleting DB sessions is enough.
    }

    return null
  }

  return { session, user }
}

