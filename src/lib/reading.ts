import { and, desc, eq, gte } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable, type bookStatuses } from "@/src/db/schema/book"
import {
  bookProgressEventsTable,
  progressEventTypes,
  readingGoalsTable,
  readingSessionsTable,
} from "@/src/db/schema/reading"

export type ProgressEventType = (typeof progressEventTypes)[number]
export type BookStatus = (typeof bookStatuses)[number]

export type ReadingSessionInput = {
  bookId: string
  durationMinutes: number
  pagesRead: number
  notes?: string | null
  startedAt?: Date
}

export async function createProgressEvent(input: {
  userId: string
  bookId: string
  eventType: ProgressEventType
  fromPage?: number | null
  toPage?: number | null
  fromStatus?: BookStatus | null
  toStatus?: BookStatus | null
  rating?: number | null
  review?: string | null
  details?: string | null
}) {
  const [event] = await db
    .insert(bookProgressEventsTable)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      bookId: input.bookId,
      eventType: input.eventType,
      fromPage: input.fromPage ?? null,
      toPage: input.toPage ?? null,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      rating: input.rating ?? null,
      review: input.review ?? null,
      details: input.details ?? null,
    })
    .returning()

  return event
}

export async function logReadingSession(userId: string, input: ReadingSessionInput) {
  if (input.durationMinutes <= 0) {
    throw new Error("Duration must be greater than zero")
  }

  if (input.pagesRead < 0) {
    throw new Error("Pages read cannot be negative")
  }

  const book = await db.query.books.findFirst({
    where: and(eq(booksTable.id, input.bookId), eq(booksTable.userId, userId)),
  })

  if (!book) {
    throw new Error("Book not found")
  }

  const [session] = await db
    .insert(readingSessionsTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      bookId: input.bookId,
      durationMinutes: input.durationMinutes,
      pagesRead: input.pagesRead,
      notes: input.notes ?? null,
      startedAt: input.startedAt ?? new Date(),
    })
    .returning()

  let updatedBook = book
  if (input.pagesRead > 0) {
    const currentPage = Math.max(0, book.currentPage)
    const unclamped = currentPage + input.pagesRead
    const nextPage = book.totalPages ? Math.min(unclamped, book.totalPages) : unclamped
    const nextStatus: BookStatus =
      book.totalPages && nextPage >= book.totalPages ? "read" : (book.status === "to_read" ? "reading" : book.status)

    const [bookAfterUpdate] = await db
      .update(booksTable)
      .set({
        currentPage: nextPage,
        status: nextStatus,
        startedAt: book.startedAt ?? new Date(),
        finishedAt: nextStatus === "read" ? (book.finishedAt ?? new Date()) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(booksTable.id, input.bookId), eq(booksTable.userId, userId)))
      .returning()

    if (bookAfterUpdate) {
      updatedBook = bookAfterUpdate
    }

    await createProgressEvent({
      userId,
      bookId: input.bookId,
      eventType: "session_logged",
      fromPage: book.currentPage,
      toPage: updatedBook.currentPage,
      fromStatus: book.status,
      toStatus: updatedBook.status,
      details: input.notes ?? null,
    })
  } else {
    await createProgressEvent({
      userId,
      bookId: input.bookId,
      eventType: "session_logged",
      fromPage: book.currentPage,
      toPage: book.currentPage,
      fromStatus: book.status,
      toStatus: book.status,
      details: input.notes ?? null,
    })
  }

  return { session, book: updatedBook }
}

export async function getBookProgressTimeline(userId: string, bookId: string, limit = 50) {
  return db.query.bookProgressEvents.findMany({
    where: and(eq(bookProgressEventsTable.userId, userId), eq(bookProgressEventsTable.bookId, bookId)),
    orderBy: [desc(bookProgressEventsTable.createdAt)],
    limit,
  })
}

function toDayKey(value: Date) {
  return value.toISOString().slice(0, 10)
}

export async function getWeeklyReadingInsights(userId: string) {
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - 6)

  const sessions = await db.query.readingSessions.findMany({
    where: and(eq(readingSessionsTable.userId, userId), gte(readingSessionsTable.startedAt, weekStart)),
    orderBy: [desc(readingSessionsTable.startedAt)],
  })

  const pagesRead = sessions.reduce((acc, session) => acc + session.pagesRead, 0)
  const minutesRead = sessions.reduce((acc, session) => acc + session.durationMinutes, 0)
  const activeDayKeys = new Set(sessions.map((session) => toDayKey(session.startedAt)))

  let currentStreak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (activeDayKeys.has(toDayKey(cursor))) {
    currentStreak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  const goal = await db.query.readingGoals.findFirst({
    where: eq(readingGoalsTable.userId, userId),
  })

  return {
    weekStart,
    sessionsCount: sessions.length,
    pagesRead,
    minutesRead,
    activeDays: activeDayKeys.size,
    currentStreak,
    dailyPageGoal: goal?.pagesPerDay ?? 0,
  }
}

export async function setDailyPageGoal(userId: string, pagesPerDay: number) {
  if (pagesPerDay < 0) {
    throw new Error("Daily page goal cannot be negative")
  }

  const [goal] = await db
    .insert(readingGoalsTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      pagesPerDay,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: readingGoalsTable.userId,
      set: {
        pagesPerDay,
        updatedAt: new Date(),
      },
    })
    .returning()

  return goal
}

