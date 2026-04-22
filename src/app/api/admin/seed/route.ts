import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import {
  bookHighlightsTable,
  bookProgressEventsTable,
  notificationsTable,
  readingSessionsTable,
} from "@/src/db/schema/reading"
import { usersTable } from "@/src/db/schema/user"
import { writeAuditLog } from "@/src/lib/audit"
import { getActiveSession } from "@/src/lib/session"

export const dynamic = "force-dynamic"

type SeedMode = "dry-run" | "apply" | "cleanup"

type DemoUser = {
  id: string
  name: string
  email: string
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
      role: "user",
      readingReminderEnabled: true,
      readingReminderDays: 5,
    },
    {
      id: makeId("user", "bruno"),
      name: "Bruno Page",
      email: "demo.bruno@shelf.local",
      role: "user",
      readingReminderEnabled: false,
      readingReminderDays: 7,
    },
    {
      id: makeId("user", "chloe"),
      name: "Chloe Notes",
      email: "demo.chloe@shelf.local",
      role: "editor",
      readingReminderEnabled: true,
      readingReminderDays: 4,
    },
    {
      id: makeId("user", "diego"),
      name: "Diego Shelf",
      email: "demo.diego@shelf.local",
      role: "moderator",
      readingReminderEnabled: true,
      readingReminderDays: 3,
    },
    {
      id: makeId("user", "elena"),
      name: "Elena Chapter",
      email: "demo.elena@shelf.local",
      role: "user",
      readingReminderEnabled: false,
      readingReminderDays: 8,
    },
    {
      id: makeId("user", "frank"),
      name: "Frank Margin",
      email: "demo.frank@shelf.local",
      role: "user",
      readingReminderEnabled: true,
      readingReminderDays: 6,
    },
    {
      id: makeId("user", "grace"),
      name: "Grace Bookmark",
      email: "demo.grace@shelf.local",
      role: "user",
      readingReminderEnabled: true,
      readingReminderDays: 10,
    },
    {
      id: makeId("user", "hugo"),
      name: "Hugo Library",
      email: "demo.hugo@shelf.local",
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
      id: makeId("book", user.id, template.suffix),
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

function buildSeedSummary() {
  const users = buildDemoUsers()
  const books = buildDemoBooks(users)

  return {
    users: users.length,
    books: books.length,
    notifications: users.length * 3,
  }
}

async function cleanupSeedData() {
  const tables = [
    "notifications",
    "book_highlights",
    "reading_sessions",
    "book_progress_events",
    "books",
    "users",
  ] as const

  const counts: Array<{ table: string; rows: number }> = []

  await db.transaction(async (tx) => {
    for (const table of tables) {
      const countResult = await tx.execute(
        sql.raw(`select count(*)::int as count from "${table}" where id like 'seed-%'`)
      )
      const rows = Number((countResult.rows[0] as { count: number } | undefined)?.count ?? 0)
      counts.push({ table, rows })
      await tx.execute(sql.raw(`delete from "${table}" where id like 'seed-%'`))
    }
  })

  return counts
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession()

  if (!activeSession || activeSession.user.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Admin access required." }, { status: 403 })
  }

  const contentType = request.headers.get("content-type") ?? ""
  let mode: SeedMode = "apply"
  let confirmPhrase = ""

  if (contentType.includes("application/json")) {
    const payload = (await request.json().catch(() => ({}))) as { mode?: string; confirmPhrase?: string }
    if (payload.mode === "dry-run" || payload.mode === "cleanup" || payload.mode === "apply") {
      mode = payload.mode
    }
    confirmPhrase = String(payload.confirmPhrase ?? "")
  } else {
    const form = await request.formData()
    const rawMode = String(form.get("mode") ?? "apply")
    if (rawMode === "dry-run" || rawMode === "cleanup" || rawMode === "apply") {
      mode = rawMode
    }
    confirmPhrase = String(form.get("confirmPhrase") ?? "")
  }

  if (mode === "apply" && confirmPhrase.trim() !== "SEED DEMO DATA") {
    return NextResponse.json(
      { ok: false, message: 'Confirmation phrase mismatch. Type "SEED DEMO DATA" to apply seed.' },
      { status: 400 }
    )
  }

  if (mode === "cleanup" && confirmPhrase.trim() !== "CLEANUP SEED DATA") {
    return NextResponse.json(
      { ok: false, message: 'Confirmation phrase mismatch. Type "CLEANUP SEED DATA" to clean seed rows.' },
      { status: 400 }
    )
  }

  if (mode === "dry-run") {
    const summary = buildSeedSummary()
    await writeAuditLog({
      actorUserId: activeSession.user.id,
      scope: "admin",
      action: "seed.demo_dry_run",
      targetType: "system",
      targetId: "demo-seed-v1",
      metadata: summary,
    })

    return NextResponse.json({
      ok: true,
      mode,
      message: "Dry-run complete. No records were written.",
      summary,
    })
  }

  if (mode === "cleanup") {
    const deleted = await cleanupSeedData()
    const totalDeleted = deleted.reduce((acc, entry) => acc + entry.rows, 0)

    await writeAuditLog({
      actorUserId: activeSession.user.id,
      scope: "admin",
      action: "seed.demo_cleanup",
      targetType: "system",
      targetId: "demo-seed-v1",
      metadata: {
        totalDeleted,
        deleted,
      },
    })

    return NextResponse.json({
      ok: true,
      mode,
      message: `Cleanup complete. Removed ${totalDeleted} seeded row(s).`,
      deleted,
    })
  }

  return GET()
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
          role: user.role,
          emailVerified: true,
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
        id: makeId("notification", user.id, "welcome"),
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
        id: makeId("notification", user.id, "info"),
        userId: user.id,
        type: "system.info",
        title: "Workspace activity",
        body: "New activity was recorded in your workspace.",
        href: "/dashboard",
        isRead: index % 2 === 0,
        readAt: index % 2 === 0 ? daysAgo(1) : null,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        id: makeId("notification", user.id, "update"),
        userId: user.id,
        type: "system.info",
        title: "Workspace update",
        body: "A new system update is available in your dashboard.",
        href: "/dashboard",
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
        notifications: notifications.length,
      },
    })

    return NextResponse.json({
      ok: true,
      message: "Demo seed completed. Existing seeded rows were left untouched.",
      summary: {
        users: users.length,
        books: books.length,
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
