import { NextResponse } from "next/server"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import {
  bookClubActivityTable,
  bookClubInvitesTable,
  bookClubMembersTable,
  bookClubPostsTable,
  bookClubsTable,
  bookHighlightsTable,
  bookProgressEventsTable,
  followsTable,
  notificationsTable,
  readingSessionsTable,
} from "@/src/db/schema/reading"
import { usersTable } from "@/src/db/schema/user"
import { writeAuditLog } from "@/src/lib/audit"
import { getActiveSession } from "@/src/lib/session"

export const dynamic = "force-dynamic"

type DemoUser = {
  id: string
  name: string
  email: string
  username: string
  role: "user" | "editor" | "moderator"
  readingReminderEnabled: boolean
  readingReminderDays: number
}

type DemoBook = {
  id: string
  userId: string
  title: string
  author: string
  totalPages: number
  currentPage: number
  status: "to_read" | "reading" | "read"
  rating?: number | null
  review?: string | null
  isFavorite?: boolean
  coverUrl?: string
}

function daysAgo(days: number) {
  const now = new Date()
  now.setDate(now.getDate() - days)
  return now
}

function makeId(...parts: string[]) {
  return `seed-${parts.join("-")}`
}

function buildDemoUsers(): DemoUser[] {
  return [
    {
      id: makeId("user", "alice"),
      name: "Alice Reader",
      email: "demo.alice@shelf.local",
      username: "demo_alice",
      role: "user",
      readingReminderEnabled: true,
      readingReminderDays: 5,
    },
    {
      id: makeId("user", "bruno"),
      name: "Bruno Page",
      email: "demo.bruno@shelf.local",
      username: "demo_bruno",
      role: "user",
      readingReminderEnabled: false,
      readingReminderDays: 7,
    },
    {
      id: makeId("user", "chloe"),
      name: "Chloe Notes",
      email: "demo.chloe@shelf.local",
      username: "demo_chloe",
      role: "editor",
      readingReminderEnabled: true,
      readingReminderDays: 4,
    },
    {
      id: makeId("user", "diego"),
      name: "Diego Shelf",
      email: "demo.diego@shelf.local",
      username: "demo_diego",
      role: "moderator",
      readingReminderEnabled: true,
      readingReminderDays: 3,
    },
    {
      id: makeId("user", "elena"),
      name: "Elena Chapter",
      email: "demo.elena@shelf.local",
      username: "demo_elena",
      role: "user",
      readingReminderEnabled: false,
      readingReminderDays: 8,
    },
    {
      id: makeId("user", "frank"),
      name: "Frank Margin",
      email: "demo.frank@shelf.local",
      username: "demo_frank",
      role: "user",
      readingReminderEnabled: true,
      readingReminderDays: 6,
    },
    {
      id: makeId("user", "grace"),
      name: "Grace Bookmark",
      email: "demo.grace@shelf.local",
      username: "demo_grace",
      role: "user",
      readingReminderEnabled: true,
      readingReminderDays: 10,
    },
    {
      id: makeId("user", "hugo"),
      name: "Hugo Library",
      email: "demo.hugo@shelf.local",
      username: "demo_hugo",
      role: "user",
      readingReminderEnabled: false,
      readingReminderDays: 7,
    },
  ]
}

function buildDemoBooks(users: DemoUser[]): DemoBook[] {
  const templates: Array<{
    suffix: string
    title: string
    author: string
    totalPages: number
    currentPage: number
    status: "to_read" | "reading" | "read"
    rating?: number | null
    review?: string | null
    isFavorite?: boolean
    coverUrl?: string
  }> = [
    {
      suffix: "queue",
      title: "The Slow Lantern",
      author: "Mina Hale",
      totalPages: 320,
      currentPage: 0,
      status: "to_read",
      coverUrl: "/book1.jpg",
    },
    {
      suffix: "active",
      title: "Orbit of Winter",
      author: "Noah Reid",
      totalPages: 410,
      currentPage: 137,
      status: "reading",
      coverUrl: "/book2.jpg",
    },
    {
      suffix: "finished",
      title: "Signal in the Dust",
      author: "Ari Stone",
      totalPages: 356,
      currentPage: 356,
      status: "read",
      rating: 4,
      review: "Strong pacing and memorable ending.",
      isFavorite: true,
      coverUrl: "/book3.jpg",
    },
    {
      suffix: "finished-two",
      title: "Before the Meridian",
      author: "Jules North",
      totalPages: 289,
      currentPage: 289,
      status: "read",
      rating: 5,
      review: "Excellent character work and atmosphere.",
      coverUrl: "/book4.jpg",
    },
  ]

  return users.flatMap((user, userIndex) =>
    templates.map((template, templateIndex) => ({
      id: makeId("book", user.username, template.suffix),
      userId: user.id,
      title: `${template.title} ${userIndex + 1}`,
      author: template.author,
      totalPages: template.totalPages,
      currentPage: template.currentPage,
      status: template.status,
      rating: template.rating ?? null,
      review: template.review ?? null,
      isFavorite: Boolean(template.isFavorite && templateIndex % 2 === 0),
      coverUrl: template.coverUrl ?? `/book${(templateIndex % 10) + 1}.jpg`,
    }))
  )
}

export async function GET() {
  const activeSession = await getActiveSession()

  if (!activeSession || activeSession.user.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Admin access required." }, { status: 403 })
  }

  const users = buildDemoUsers()
  const books = buildDemoBooks(users)

  try {
    await db
      .insert(usersTable)
      .values(
        users.map((user, index) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          emailVerified: true,
          publicProfileEnabled: true,
          publicShowHighlights: index % 2 === 0,
          publicHighlightsLimit: 3,
          readingReminderEnabled: user.readingReminderEnabled,
          readingReminderChannel: "email",
          readingReminderDays: user.readingReminderDays,
          createdAt: daysAgo(90 - index * 4),
          updatedAt: daysAgo(index),
        }))
      )
      .onConflictDoNothing({ target: usersTable.id })

    await db
      .insert(booksTable)
      .values(
        books.map((book, index) => ({
          ...book,
          isbn: `97800000${String(index + 101).padStart(5, "0")}`,
          notes: `Seeded demo data for ${book.title}.`,
          dailyPageGoal: book.status === "reading" ? 20 : null,
          startedAt: book.status === "to_read" ? null : daysAgo(18 + index % 9),
          finishedAt: book.status === "read" ? daysAgo(5 + (index % 7)) : null,
          createdAt: daysAgo(60 - (index % 15)),
          updatedAt: daysAgo(index % 6),
        }))
      )
      .onConflictDoNothing({ target: booksTable.id })

    const follows = [
      [users[0], users[1]],
      [users[0], users[2]],
      [users[1], users[0]],
      [users[2], users[0]],
      [users[2], users[3]],
      [users[3], users[2]],
      [users[4], users[0]],
      [users[5], users[0]],
      [users[6], users[3]],
      [users[7], users[1]],
      [users[7], users[2]],
    ]

    await db
      .insert(followsTable)
      .values(
        follows.map(([follower, following]) => ({
          id: makeId("follow", follower.username, following.username),
          followerId: follower.id,
          followingId: following.id,
          createdAt: daysAgo(20),
        }))
      )
      .onConflictDoNothing({ target: followsTable.id })

    const clubs = [
      {
        id: makeId("club", "fantasy-circle"),
        ownerId: users[0].id,
        name: "Fantasy Circle",
        description: "Epic fantasy reads and monthly check-ins.",
      },
      {
        id: makeId("club", "sci-fi-lab"),
        ownerId: users[2].id,
        name: "Sci-Fi Lab",
        description: "Speculative fiction, hard sci-fi, and space opera picks.",
      },
    ]

    await db
      .insert(bookClubsTable)
      .values(
        clubs.map((club) => ({
          ...club,
          isPublic: true,
          createdAt: daysAgo(45),
          updatedAt: daysAgo(2),
        }))
      )
      .onConflictDoNothing({ target: bookClubsTable.id })

    const memberships = [
      { clubId: clubs[0].id, userId: users[0].id, role: "owner" as const },
      { clubId: clubs[0].id, userId: users[1].id, role: "member" as const },
      { clubId: clubs[0].id, userId: users[3].id, role: "moderator" as const },
      { clubId: clubs[1].id, userId: users[2].id, role: "owner" as const },
      { clubId: clubs[1].id, userId: users[4].id, role: "member" as const },
      { clubId: clubs[1].id, userId: users[5].id, role: "member" as const },
    ]

    await db
      .insert(bookClubMembersTable)
      .values(
        memberships.map((member) => ({
          id: makeId("membership", member.clubId, member.userId),
          clubId: member.clubId,
          userId: member.userId,
          role: member.role,
          createdAt: daysAgo(35),
        }))
      )
      .onConflictDoNothing({ target: bookClubMembersTable.id })

    await db
      .insert(bookClubPostsTable)
      .values([
        {
          id: makeId("post", "fantasy", "welcome"),
          clubId: clubs[0].id,
          authorUserId: users[3].id,
          title: "Welcome to Fantasy Circle",
          body: "Introduce yourself and share your current fantasy read.",
          isAnnouncement: true,
          createdAt: daysAgo(12),
          updatedAt: daysAgo(12),
        },
        {
          id: makeId("post", "scifi", "thread"),
          clubId: clubs[1].id,
          authorUserId: users[2].id,
          title: "Best first-contact stories",
          body: "Drop your top recommendations for first-contact novels.",
          isAnnouncement: false,
          createdAt: daysAgo(8),
          updatedAt: daysAgo(7),
        },
      ])
      .onConflictDoNothing({ target: bookClubPostsTable.id })

    await db
      .insert(bookClubInvitesTable)
      .values([
        {
          id: makeId("invite", "fantasy", users[6].id),
          clubId: clubs[0].id,
          inviterUserId: users[3].id,
          invitedUserId: users[6].id,
          role: "member",
          status: "pending",
          createdAt: daysAgo(3),
          updatedAt: daysAgo(3),
        },
      ])
      .onConflictDoNothing({ target: bookClubInvitesTable.id })

    await db
      .insert(bookClubActivityTable)
      .values([
        {
          id: makeId("activity", "fantasy", "announce"),
          clubId: clubs[0].id,
          actorUserId: users[3].id,
          activityType: "discussion_posted",
          details: "Posted welcome announcement",
          createdAt: daysAgo(12),
        },
        {
          id: makeId("activity", "scifi", "thread"),
          clubId: clubs[1].id,
          actorUserId: users[2].id,
          activityType: "discussion_posted",
          details: "Posted first-contact discussion",
          createdAt: daysAgo(8),
        },
      ])
      .onConflictDoNothing({ target: bookClubActivityTable.id })

    const readAndReadingBooks = books.filter((book) => book.status !== "to_read")

    await db
      .insert(bookProgressEventsTable)
      .values(
        readAndReadingBooks.flatMap((book, index) => {
          const events: Array<typeof bookProgressEventsTable.$inferInsert> = [
            {
              id: makeId("progress", book.id, "status"),
              userId: book.userId,
              bookId: book.id,
              eventType: "status_change" as const,
              fromPage: 0,
              toPage: book.currentPage,
              fromStatus: "to_read" as const,
              toStatus: book.status,
              createdAt: daysAgo(14 - (index % 6)),
            },
            {
              id: makeId("progress", book.id, "page"),
              userId: book.userId,
              bookId: book.id,
              eventType: "page_update" as const,
              fromPage: 0,
              toPage: book.currentPage,
              fromStatus: book.status,
              toStatus: book.status,
              createdAt: daysAgo(7 - (index % 4)),
            },
          ]

          if (book.status === "read" && book.rating) {
            events.push({
              id: makeId("progress", book.id, "rating"),
              userId: book.userId,
              bookId: book.id,
              eventType: "rating_updated" as const,
              fromPage: book.currentPage,
              toPage: book.currentPage,
              fromStatus: "read" as const,
              toStatus: "read" as const,
              rating: book.rating,
              createdAt: daysAgo(2),
            })
          }

          return events
        })
      )
      .onConflictDoNothing({ target: bookProgressEventsTable.id })

    await db
      .insert(readingSessionsTable)
      .values(
        readAndReadingBooks.slice(0, 16).map((book, index) => ({
          id: makeId("session", book.id),
          userId: book.userId,
          bookId: book.id,
          startedAt: daysAgo(6 - (index % 5)),
          durationMinutes: 20 + (index % 4) * 15,
          pagesRead: 8 + (index % 5) * 6,
          notes: "Seeded demo reading session",
          createdAt: daysAgo(6 - (index % 5)),
        }))
      )
      .onConflictDoNothing({ target: readingSessionsTable.id })

    const highlightBooks = books.filter((book) => book.status === "read").slice(0, 12)

    await db
      .insert(bookHighlightsTable)
      .values(
        highlightBooks.map((book, index) => ({
          id: makeId("highlight", book.id),
          userId: book.userId,
          bookId: book.id,
          quote: `Seeded highlight for ${book.title}: memorable line ${index + 1}.`,
          page: 20 + index * 3,
          highlightedAt: daysAgo(4 + (index % 4)),
          createdAt: daysAgo(4 + (index % 4)),
          updatedAt: daysAgo(3 + (index % 3)),
        }))
      )
      .onConflictDoNothing({ target: bookHighlightsTable.id })

    const notifications = users.flatMap((user, index) => [
      {
        id: makeId("notification", user.username, "welcome"),
        userId: user.id,
        type: "system.info",
        title: "Welcome to Shelf demo",
        body: "This account was generated by the admin seed endpoint.",
        href: "/dashboard",
        isRead: false,
        readAt: null,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        id: makeId("notification", user.username, "social"),
        userId: user.id,
        type: "social.follow",
        title: "New follower",
        body: `@${users[(index + 1) % users.length]?.username ?? "demo"} followed your profile.`,
        href: `/u/${user.username}`,
        isRead: index % 2 === 0,
        readAt: index % 2 === 0 ? daysAgo(1) : null,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        id: makeId("notification", user.username, "club"),
        userId: user.id,
        type: "club.announcement",
        title: "Club update",
        body: "A new announcement was posted in one of your clubs.",
        href: "/social",
        isRead: false,
        readAt: null,
        createdAt: daysAgo(0),
        updatedAt: daysAgo(0),
      },
    ])

    await db
      .insert(notificationsTable)
      .values(notifications)
      .onConflictDoNothing({ target: notificationsTable.id })

    await writeAuditLog({
      actorUserId: activeSession.user.id,
      scope: "admin",
      action: "seed.demo_generated",
      targetType: "system",
      targetId: "demo-seed-v1",
      metadata: {
        users: users.length,
        books: books.length,
        follows: follows.length,
        clubs: clubs.length,
        notifications: notifications.length,
      },
    })

    return NextResponse.json({
      ok: true,
      message: "Demo seed completed. Existing seeded rows were left untouched.",
      summary: {
        users: users.length,
        books: books.length,
        follows: follows.length,
        clubs: clubs.length,
        memberships: memberships.length,
        notifications: notifications.length,
      },
    })
  } catch (error) {
    console.error("Failed to seed demo data:", error)
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to seed demo data." },
      { status: 500 }
    )
  }
}

