import { and, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { bookClubMembersTable, bookClubsTable } from "@/src/db/schema/reading"

type ClubRole = "owner" | "moderator" | "member"

const roleRank: Record<ClubRole, number> = {
  member: 1,
  moderator: 2,
  owner: 3,
}

export async function getClubMembership(clubId: string, userId: string) {
  const [club, membership] = await Promise.all([
    db.query.bookClubs.findFirst({ where: eq(bookClubsTable.id, clubId) }),
    db.query.bookClubMembers.findFirst({
      where: and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, userId)),
    }),
  ])

  return { club, membership }
}

export async function requireClubMembership(clubId: string, userId: string) {
  const { club, membership } = await getClubMembership(clubId, userId)

  if (!club) {
    throw new Error("Book club not found")
  }

  if (!membership) {
    throw new Error("You are not a member of this club")
  }

  return { club, membership }
}

export async function requireClubRole(clubId: string, userId: string, minimumRole: ClubRole) {
  const { club, membership } = await requireClubMembership(clubId, userId)

  if (roleRank[membership.role] < roleRank[minimumRole]) {
    throw new Error("You do not have permission for this action")
  }

  return { club, membership }
}

export function canManageRole(actorRole: ClubRole, targetRole: ClubRole) {
  if (actorRole === "owner") {
    return targetRole !== "owner"
  }

  if (actorRole === "moderator") {
    return targetRole === "member"
  }

  return false
}

