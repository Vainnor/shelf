"use server"

import { and, desc, eq, inArray, isNotNull, ne } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { bookClubMembersTable, bookClubsTable } from "@/src/db/schema/reading"
import { usersTable } from "@/src/db/schema/user"
import { getActiveSession } from "@/src/lib/session"

export type CommandTargetGroup = "books" | "clubs" | "users" | "settings"

export type CommandTarget = {
  id: string
  label: string
  description?: string
  href: string
  group: CommandTargetGroup
  resultType: "Book" | "Club" | "User" | "Route"
}

export type CommandSearchResult = {
  books: CommandTarget[]
  clubs: CommandTarget[]
  users: CommandTarget[]
  settings: CommandTarget[]
}

function buildSettingsTargets(isAdmin: boolean): CommandTarget[] {
  const targets: CommandTarget[] = [
    {
      id: "settings-account",
      label: "Settings",
      description: "Account preferences",
      href: "/settings",
      group: "settings",
      resultType: "Route",
    },
    {
      id: "settings-notifications",
      label: "Notifications",
      description: "View all notifications",
      href: "/notifications",
      group: "settings",
      resultType: "Route",
    },
    {
      id: "settings-social",
      label: "Social",
      description: "Profiles and clubs",
      href: "/social",
      group: "settings",
      resultType: "Route",
    },
  ]

  if (isAdmin) {
    targets.push({
      id: "settings-admin",
      label: "Admin",
      description: "Admin dashboard",
      href: "/admin",
      group: "settings",
      resultType: "Route",
    })
  }

  return targets
}

function normalizeForFuzzy(value: string) {
  return value.toLowerCase().trim()
}

function fuzzyScore(haystackRaw: string, needleRaw: string) {
  const haystack = normalizeForFuzzy(haystackRaw)
  const needle = normalizeForFuzzy(needleRaw)

  if (!needle) {
    return 1
  }

  if (haystack === needle) {
    return 2000
  }

  const substringIndex = haystack.indexOf(needle)
  if (substringIndex >= 0) {
    return 1200 - substringIndex
  }

  let score = 0
  let haystackIndex = 0
  let consecutive = 0

  for (let needleIndex = 0; needleIndex < needle.length; needleIndex += 1) {
    const needleChar = needle[needleIndex]
    const foundIndex = haystack.indexOf(needleChar, haystackIndex)
    if (foundIndex === -1) {
      return 0
    }

    const isConsecutive = foundIndex === haystackIndex
    consecutive = isConsecutive ? consecutive + 1 : 0
    score += 10 + consecutive * 3
    haystackIndex = foundIndex + 1
  }

  return score
}

function rankTargetsByQuery(targets: CommandTarget[], query: string, limit: number) {
  if (!query.trim()) {
    return targets.slice(0, limit)
  }

  return targets
    .map((target) => {
      const score = fuzzyScore(`${target.label} ${target.description ?? ""}`, query)
      return { target, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.target)
}

export async function searchCommandTargets(query: string): Promise<CommandSearchResult> {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    return { books: [], clubs: [], users: [], settings: [] }
  }

  const normalized = query.trim()
  const sessionUserId = activeSession.session.user.id

  const [books, memberships, publicClubs, users] = await Promise.all([
    db.query.books.findMany({
      where: eq(booksTable.userId, sessionUserId),
      orderBy: [desc(booksTable.updatedAt)],
      limit: 120,
    }),
    db.query.bookClubMembers.findMany({
      where: eq(bookClubMembersTable.userId, sessionUserId),
      columns: { clubId: true },
      limit: 40,
    }),
    db.query.bookClubs.findMany({
      where: eq(bookClubsTable.isPublic, true),
      orderBy: [desc(bookClubsTable.updatedAt)],
      limit: 80,
    }),
    db.query.user.findMany({
      where: and(
        ne(usersTable.id, sessionUserId),
        eq(usersTable.publicProfileEnabled, true),
        isNotNull(usersTable.username)
      ),
      orderBy: [desc(usersTable.updatedAt)],
      limit: 80,
    }),
  ])

  const memberClubIds = Array.from(new Set(memberships.map((item) => item.clubId)))
  const memberClubs = memberClubIds.length
    ? await db.query.bookClubs.findMany({
        where: inArray(bookClubsTable.id, memberClubIds),
        orderBy: [desc(bookClubsTable.updatedAt)],
        limit: 80,
      })
    : []

  const clubsById = new Map<string, CommandTarget>()
  for (const club of [...memberClubs, ...publicClubs]) {
    clubsById.set(club.id, {
      id: `club-${club.id}`,
      label: club.name,
      description: club.description ?? (club.isPublic ? "Public club" : "Private club"),
      href: `/clubs/${club.id}`,
      group: "clubs",
      resultType: "Club",
    })
  }

  const settings = buildSettingsTargets(activeSession.user.role === "admin")

  return {
    books: rankTargetsByQuery(
      books.map((book) => ({
        id: `book-${book.id}`,
        label: book.title,
        description: `${book.author} - ${book.status.replace("_", " ")}`,
        href: `/books/${book.id}`,
        group: "books",
        resultType: "Book" as const,
      })),
      normalized,
      8
    ),
    clubs: rankTargetsByQuery(Array.from(clubsById.values()), normalized, 8),
    users: rankTargetsByQuery(
      users.map((user) => ({
        id: `user-${user.id}`,
        label: user.username ?? user.name ?? user.email,
        description: user.name ?? user.email,
        href: user.username ? `/u/${user.username}` : "/social",
        group: "users",
        resultType: "User" as const,
      })),
      normalized,
      8
    ),
    settings: rankTargetsByQuery(settings, normalized, 8),
  }
}

