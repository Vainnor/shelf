import { and, desc, eq, gte } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable, type bookStatuses } from "@/src/db/schema/book"
import {
  bookHighlightsTable,
  bookProgressEventsTable,
  progressEventTypes,
  readingGoalsTable,
  readingSessionsTable,
} from "@/src/db/schema/reading"

export type ProgressEventType = (typeof progressEventTypes)[number]
export type BookStatus = (typeof bookStatuses)[number]
export type GoalCadence = "monthly" | "yearly"

export type ReadingGoalsV2Input = {
  pagesPerDay?: number
  yearlyTarget?: number | null
  monthlyTarget?: number | null
  targetYear?: number | null
  targetMonth?: number | null
}

export type ReadingGoalPace = {
  cadence: GoalCadence
  target: number
  progress: number
  expectedProgress: number
  isOnTrack: boolean
}

export type ReadingSessionInput = {
  bookId: string
  durationMinutes: number
  pagesRead: number
  notes?: string | null
  startedAt?: Date
}

export type BookHighlightInput = {
  bookId: string
  quote: string
  page?: number | null
  highlightedAt?: Date | null
}

export type UpdateBookHighlightInput = {
  quote?: string
  page?: number | null
  highlightedAt?: Date | null
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

export async function setReadingGoalsV2(userId: string, input: ReadingGoalsV2Input) {
  if (input.pagesPerDay !== undefined && input.pagesPerDay < 0) {
    throw new Error("Daily page goal cannot be negative")
  }

  if (input.yearlyTarget !== undefined && input.yearlyTarget !== null && input.yearlyTarget < 0) {
    throw new Error("Yearly target cannot be negative")
  }

  if (input.monthlyTarget !== undefined && input.monthlyTarget !== null && input.monthlyTarget < 0) {
    throw new Error("Monthly target cannot be negative")
  }

  const existingGoal = await db.query.readingGoals.findFirst({
    where: eq(readingGoalsTable.userId, userId),
  })

  const [goal] = await db
    .insert(readingGoalsTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      pagesPerDay: input.pagesPerDay ?? existingGoal?.pagesPerDay ?? 0,
      yearlyTarget: input.yearlyTarget ?? existingGoal?.yearlyTarget ?? null,
      monthlyTarget: input.monthlyTarget ?? existingGoal?.monthlyTarget ?? null,
      targetYear: input.targetYear ?? existingGoal?.targetYear ?? null,
      targetMonth: input.targetMonth ?? existingGoal?.targetMonth ?? null,
      pacingUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: readingGoalsTable.userId,
      set: {
        pagesPerDay: input.pagesPerDay ?? existingGoal?.pagesPerDay ?? 0,
        yearlyTarget: input.yearlyTarget ?? existingGoal?.yearlyTarget ?? null,
        monthlyTarget: input.monthlyTarget ?? existingGoal?.monthlyTarget ?? null,
        targetYear: input.targetYear ?? existingGoal?.targetYear ?? null,
        targetMonth: input.targetMonth ?? existingGoal?.targetMonth ?? null,
        pacingUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning()

  return goal
}

export function computeGoalPace(input: {
  cadence: GoalCadence
  target: number
  progress: number
  elapsedDays: number
  totalDays: number
}): ReadingGoalPace {
  const normalizedTarget = Math.max(0, input.target)
  const normalizedProgress = Math.max(0, input.progress)
  const normalizedElapsed = Math.max(0, Math.min(input.elapsedDays, input.totalDays))
  const expectedProgress =
    input.totalDays > 0 ? Math.floor((normalizedTarget * normalizedElapsed) / input.totalDays) : 0

  return {
    cadence: input.cadence,
    target: normalizedTarget,
    progress: normalizedProgress,
    expectedProgress,
    isOnTrack: normalizedProgress >= expectedProgress,
  }
}

export async function getBookHighlights(userId: string, bookId: string, limit = 100) {
  return db.query.bookHighlights.findMany({
    where: and(eq(bookHighlightsTable.userId, userId), eq(bookHighlightsTable.bookId, bookId)),
    orderBy: [desc(bookHighlightsTable.highlightedAt), desc(bookHighlightsTable.createdAt)],
    limit,
  })
}

export async function createBookHighlight(userId: string, input: BookHighlightInput) {
  const quote = input.quote.trim()
  if (!quote) {
    throw new Error("Highlight quote is required")
  }

  if (input.page !== undefined && input.page !== null && input.page <= 0) {
    throw new Error("Page must be greater than zero")
  }

  const book = await db.query.books.findFirst({
    where: and(eq(booksTable.id, input.bookId), eq(booksTable.userId, userId)),
  })

  if (!book) {
    throw new Error("Book not found")
  }

  const [highlight] = await db
    .insert(bookHighlightsTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      bookId: input.bookId,
      quote,
      page: input.page ?? null,
      highlightedAt: input.highlightedAt ?? null,
      updatedAt: new Date(),
    })
    .returning()

  return highlight
}

export async function updateBookHighlight(userId: string, highlightId: string, input: UpdateBookHighlightInput) {
  const existing = await db.query.bookHighlights.findFirst({
    where: and(eq(bookHighlightsTable.id, highlightId), eq(bookHighlightsTable.userId, userId)),
  })

  if (!existing) {
    throw new Error("Highlight not found")
  }

  const nextQuote = input.quote === undefined ? existing.quote : input.quote.trim()
  if (!nextQuote) {
    throw new Error("Highlight quote is required")
  }

  const nextPage = input.page === undefined ? existing.page : input.page
  if (nextPage !== null && nextPage !== undefined && nextPage <= 0) {
    throw new Error("Page must be greater than zero")
  }

  const nextHighlightedAt =
    input.highlightedAt === undefined ? existing.highlightedAt : input.highlightedAt

  const [highlight] = await db
    .update(bookHighlightsTable)
    .set({
      quote: nextQuote,
      page: nextPage ?? null,
      highlightedAt: nextHighlightedAt ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(bookHighlightsTable.id, highlightId), eq(bookHighlightsTable.userId, userId)))
    .returning()

  return highlight
}

export async function deleteBookHighlight(userId: string, highlightId: string) {
  const [deleted] = await db
    .delete(bookHighlightsTable)
    .where(and(eq(bookHighlightsTable.id, highlightId), eq(bookHighlightsTable.userId, userId)))
    .returning()

  if (!deleted) {
    throw new Error("Highlight not found")
  }

  return deleted
}
