"use server"

import { and, eq, ilike, inArray, isNotNull, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import {
  bookClubMembersTable,
  bookClubsTable,
  followsTable,
} from "@/src/db/schema/reading"
import { usersTable } from "@/src/db/schema/user"
import { getActiveSession } from "@/src/lib/session"

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,30}$/.test(value)
}

async function requireActiveSession() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    throw new Error("Unauthorized")
  }

  return activeSession.session
}

export async function updatePublicProfileSettings(input: {
  username: string
  publicProfileEnabled: boolean
}) {
  const session = await requireActiveSession()
  const username = normalizeUsername(input.username)

  if (!isValidUsername(username)) {
    throw new Error("Username must be 3-30 chars with letters, numbers, or underscores")
  }

  const existing = await db.query.user.findFirst({
    where: and(eq(usersTable.username, username), ne(usersTable.id, session.user.id)),
  })

  if (existing) {
    throw new Error("That username is already taken")
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      username,
      publicProfileEnabled: input.publicProfileEnabled,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, session.user.id))
    .returning()

  if (!updated) {
    throw new Error("Failed to update profile visibility")
  }

  revalidatePath("/settings")
  revalidatePath(`/u/${username}`)

  return {
    username: updated.username,
    publicProfileEnabled: updated.publicProfileEnabled,
  }
}

export async function getPublicProfileByUsername(rawUsername: string) {
  const username = normalizeUsername(rawUsername)
  const activeSession = await getActiveSession()

  const user = await db.query.user.findFirst({
    where: and(eq(usersTable.username, username), eq(usersTable.publicProfileEnabled, true)),
  })

  if (!user || !user.username) {
    return null
  }

  const [recentBooks, allBooks, followers, following] = await Promise.all([
    db.query.books.findMany({
      where: eq(booksTable.userId, user.id),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
      limit: 8,
    }),
    db.query.books.findMany({
      where: eq(booksTable.userId, user.id),
    }),
    db.query.follows.findMany({ where: eq(followsTable.followingId, user.id) }),
    db.query.follows.findMany({ where: eq(followsTable.followerId, user.id) }),
  ])

  const isFollowing = activeSession
    ? Boolean(
        await db.query.follows.findFirst({
          where: and(
            eq(followsTable.followerId, activeSession.session.user.id),
            eq(followsTable.followingId, user.id)
          ),
        })
      )
    : false

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
    },
    stats: {
      totalBooks: allBooks.length,
      toRead: allBooks.filter((book) => book.status === "to_read").length,
      reading: allBooks.filter((book) => book.status === "reading").length,
      read: allBooks.filter((book) => book.status === "read").length,
      followers: followers.length,
      following: following.length,
    },
    recentBooks,
    viewer: {
      isLoggedIn: Boolean(activeSession),
      isOwnProfile: activeSession?.session.user.id === user.id,
      isFollowing,
    },
  }
}

export async function followUserByUsername(rawUsername: string) {
  const session = await requireActiveSession()
  const username = normalizeUsername(rawUsername)

  const target = await db.query.user.findFirst({
    where: and(eq(usersTable.username, username), eq(usersTable.publicProfileEnabled, true)),
  })

  if (!target || !target.username) {
    throw new Error("User not found")
  }

  if (target.id === session.user.id) {
    throw new Error("You cannot follow yourself")
  }

  await db
    .insert(followsTable)
    .values({
      id: crypto.randomUUID(),
      followerId: session.user.id,
      followingId: target.id,
    })
    .onConflictDoNothing({ target: [followsTable.followerId, followsTable.followingId] })

  revalidatePath(`/u/${target.username}`)
  revalidatePath("/social")

  return { ok: true }
}

export async function unfollowUserByUsername(rawUsername: string) {
  const session = await requireActiveSession()
  const username = normalizeUsername(rawUsername)

  const target = await db.query.user.findFirst({
    where: eq(usersTable.username, username),
  })

  if (!target || !target.username) {
    throw new Error("User not found")
  }

  await db
    .delete(followsTable)
    .where(and(eq(followsTable.followerId, session.user.id), eq(followsTable.followingId, target.id)))

  revalidatePath(`/u/${target.username}`)
  revalidatePath("/social")

  return { ok: true }
}

export async function getSocialHomeData() {
  const session = await requireActiveSession()

  const [followingRows, followerRows, clubMemberships] = await Promise.all([
    db.query.follows.findMany({ where: eq(followsTable.followerId, session.user.id) }),
    db.query.follows.findMany({ where: eq(followsTable.followingId, session.user.id) }),
    db.query.bookClubMembers.findMany({ where: eq(bookClubMembersTable.userId, session.user.id) }),
  ])

  const followingIds = followingRows.map((row) => row.followingId)
  const clubIds = clubMemberships.map((membership) => membership.clubId)

  const [feedBooks, feedUsers, myClubs, discoverableUsers, publicClubs] = await Promise.all([
    followingIds.length
      ? db.query.books.findMany({
          where: inArray(booksTable.userId, followingIds),
          orderBy: (table, { desc }) => [desc(table.updatedAt)],
          limit: 20,
        })
      : Promise.resolve([]),
    followingIds.length
      ? db.query.user.findMany({ where: inArray(usersTable.id, followingIds) })
      : Promise.resolve([]),
    clubIds.length
      ? db.query.bookClubs.findMany({ where: inArray(bookClubsTable.id, clubIds) })
      : Promise.resolve([]),
    db.query.user.findMany({
      where: and(
        eq(usersTable.publicProfileEnabled, true),
        isNotNull(usersTable.username),
        ne(usersTable.id, session.user.id)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: 12,
    }),
    db.query.bookClubs.findMany({
      where: eq(bookClubsTable.isPublic, true),
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
      limit: 12,
    }),
  ])

  const userById = new Map(feedUsers.map((user) => [user.id, user]))

  const feed = feedBooks.map((book) => {
    const owner = userById.get(book.userId)
    return {
      book,
      owner: owner
        ? {
            id: owner.id,
            name: owner.name,
            username: owner.username,
            image: owner.image,
          }
        : null,
    }
  })

  return {
    followingCount: followingRows.length,
    followersCount: followerRows.length,
    followingUserIds: followingRows.map((row) => row.followingId),
    feed,
    myClubs,
    discoverableUsers,
    publicClubs,
  }
}

export async function createBookClub(input: { name: string; description?: string | null; isPublic?: boolean }) {
  const session = await requireActiveSession()
  const name = input.name.trim()

  if (!name) {
    throw new Error("Club name is required")
  }

  const [club] = await db
    .insert(bookClubsTable)
    .values({
      id: crypto.randomUUID(),
      ownerId: session.user.id,
      name,
      description: input.description?.trim() || null,
      isPublic: input.isPublic ?? true,
    })
    .returning()

  if (!club) {
    throw new Error("Failed to create book club")
  }

  await db
    .insert(bookClubMembersTable)
    .values({
      id: crypto.randomUUID(),
      clubId: club.id,
      userId: session.user.id,
      role: "owner",
    })
    .onConflictDoNothing({ target: [bookClubMembersTable.clubId, bookClubMembersTable.userId] })

  revalidatePath("/social")

  return club
}

export async function joinBookClub(clubId: string) {
  const session = await requireActiveSession()

  const club = await db.query.bookClubs.findFirst({ where: eq(bookClubsTable.id, clubId) })
  if (!club) {
    throw new Error("Book club not found")
  }

  if (!club.isPublic && club.ownerId !== session.user.id) {
    throw new Error("This book club is invite-only")
  }

  await db
    .insert(bookClubMembersTable)
    .values({
      id: crypto.randomUUID(),
      clubId,
      userId: session.user.id,
      role: "member",
    })
    .onConflictDoNothing({ target: [bookClubMembersTable.clubId, bookClubMembersTable.userId] })

  revalidatePath("/social")

  return { ok: true }
}

export async function leaveBookClub(clubId: string) {
  const session = await requireActiveSession()

  const membership = await db.query.bookClubMembers.findFirst({
    where: and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, session.user.id)),
  })

  if (!membership) {
    return { ok: true }
  }

  if (membership.role === "owner") {
    throw new Error("Transfer ownership before leaving your own club")
  }

  await db
    .delete(bookClubMembersTable)
    .where(and(eq(bookClubMembersTable.clubId, clubId), eq(bookClubMembersTable.userId, session.user.id)))

  revalidatePath("/social")

  return { ok: true }
}

export async function searchPublicProfiles(query: string) {
  const normalized = query.trim()
  if (!normalized) {
    return []
  }

  return db.query.user.findMany({
    where: and(
      eq(usersTable.publicProfileEnabled, true),
      isNotNull(usersTable.username),
      ilike(usersTable.username, `%${normalized}%`)
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 20,
  })
}

