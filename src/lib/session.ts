import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/src/db"
import { sessionsTable, usersTable } from "@/src/db/schema/user"
import { auth } from "@/src/lib/auth"

export async function getActiveSession() {
  const requestHeaders = await headers()

  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!session) {
    return null
  }

  const user = await db.query.user.findFirst({
    where: eq(usersTable.id, session.user.id),
  })

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

