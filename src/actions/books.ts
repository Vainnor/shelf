"use server"

import { getActiveSession } from "@/src/lib/session"
import {
  listBooksForUser,
  listReadingRemindersForUser,
  listRecommendationsForUser,
  createBook,
  updateBook,
  updateBookStatus,
  deleteBook,
  type BookQueryFilters,
  type BookStatus,
  type BookInput,
} from "@/src/lib/books"
import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { usersTable } from "@/src/db/schema/user"
import { and, eq, gte } from "drizzle-orm"
import {
  createProgressEvent,
  getBookHighlights,
  getBookProgressTimeline,
  getWeeklyReadingInsights,
  logReadingSession,
  setDailyPageGoal,
  createBookHighlight,
  updateBookHighlight,
  deleteBookHighlight,
} from "@/src/lib/reading"

async function requireActiveSession() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    throw new Error("Unauthorized")
  }

  return activeSession.session
}

export async function getBooks(filters?: BookStatus | BookQueryFilters) {
  const session = await requireActiveSession()
  const normalizedFilters: BookQueryFilters | undefined =
    typeof filters === "string" ? { status: filters } : filters

  try {
    const books = await listBooksForUser(session.user.id, normalizedFilters)
    return books
  } catch (error) {
    console.error("Error fetching books:", error)
    throw new Error("Failed to fetch books")
  }
}

export type LogReadingSessionInput = {
  bookId: string
  durationMinutes: number
  pagesRead: number
  notes?: string | null
}

export type IsbnLookupResult = {
  title: string
  author: string
  totalPages: number | null
  coverUrl: string | null
  isbn: string
  notes: string | null
}

type OpenLibraryBook = {
  title?: string
  subtitle?: string
  authors?: Array<{ name?: string }>
  cover?: {
    large?: string
    medium?: string
    small?: string
  }
  number_of_pages?: number
  publish_date?: string
  publishers?: Array<{ name?: string }>
  subjects?: Array<{ name?: string }>
}

function normalizeIsbn(isbn: string) {
  return isbn.replace(/[^0-9Xx]/g, "").toUpperCase()
}

export async function lookupBookByIsbn(rawIsbn: string): Promise<IsbnLookupResult> {
  await requireActiveSession()

  const isbn = normalizeIsbn(rawIsbn)
  if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
    throw new Error("Please enter a valid ISBN-10 or ISBN-13")
  }

  const bibKey = `ISBN:${isbn}`
  const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(bibKey)}&format=json&jscmd=data`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Unable to reach OpenLibrary")
    }

    const payload = (await response.json()) as Record<string, OpenLibraryBook>
    const book = payload[bibKey]

    if (!book || !book.title) {
      throw new Error("No book found for that ISBN")
    }

    const author =
      book.authors
        ?.map((item) => item.name?.trim())
        .filter((value): value is string => Boolean(value))
        .join(", ") ?? "Unknown Author"

    const coverUrl = book.cover?.large ?? book.cover?.medium ?? book.cover?.small ?? null

    const notesParts: string[] = []
    if (book.subtitle) notesParts.push(`Subtitle: ${book.subtitle}`)
    if (book.publish_date) notesParts.push(`Published: ${book.publish_date}`)

    const publisherNames =
      book.publishers
        ?.map((item) => item.name?.trim())
        .filter((value): value is string => Boolean(value))
        .slice(0, 2) ?? []
    if (publisherNames.length > 0) notesParts.push(`Publisher: ${publisherNames.join(", ")}`)

    const genres =
      book.subjects
        ?.map((item) => item.name?.trim())
        .filter((value): value is string => Boolean(value))
        .slice(0, 3) ?? []
    if (genres.length > 0) notesParts.push(`Genres: ${genres.join(", ")}`)

    return {
      title: book.title,
      author,
      totalPages: book.number_of_pages ?? null,
      coverUrl,
      isbn,
      notes: notesParts.length > 0 ? notesParts.join("\n") : null,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to lookup ISBN")
  }
}

export async function addBook(input: BookInput) {
  const session = await requireActiveSession()

  try {
    const book = await createBook(session.user.id, input)
    return book
  } catch (error) {
    console.error("Error creating book:", error)
    throw new Error("Failed to create book")
  }
}

export async function editBook(bookId: string, input: Partial<BookInput>) {
  const session = await requireActiveSession()

  try {
    const existingBook = await getBookByIdForUser(session.user.id, bookId)
    const book = await updateBook(session.user.id, bookId, input)

    if (book && existingBook) {
      if (input.currentPage !== undefined && input.currentPage !== existingBook.currentPage) {
        await createProgressEvent({
          userId: session.user.id,
          bookId,
          eventType: "page_update",
          fromPage: existingBook.currentPage,
          toPage: book.currentPage,
          fromStatus: existingBook.status,
          toStatus: book.status,
        })
      }

      if (input.rating !== undefined && input.rating !== existingBook.rating) {
        await createProgressEvent({
          userId: session.user.id,
          bookId,
          eventType: "rating_updated",
          rating: book.rating,
          fromStatus: existingBook.status,
          toStatus: book.status,
        })
      }

      if (input.review !== undefined && input.review !== existingBook.review) {
        await createProgressEvent({
          userId: session.user.id,
          bookId,
          eventType: "review_updated",
          review: book.review,
          fromStatus: existingBook.status,
          toStatus: book.status,
        })
      }
    }

    return book
  } catch (error) {
    console.error("Error updating book:", error)
    throw new Error("Failed to update book")
  }
}

export async function changeBookStatus(bookId: string, status: BookStatus) {
  const session = await requireActiveSession()

  try {
    const existingBook = await getBookByIdForUser(session.user.id, bookId)
    const book = await updateBookStatus(session.user.id, bookId, status)
    if (book && existingBook && existingBook.status !== book.status) {
      await createProgressEvent({
        userId: session.user.id,
        bookId,
        eventType: "status_change",
        fromPage: existingBook.currentPage,
        toPage: book.currentPage,
        fromStatus: existingBook.status,
        toStatus: book.status,
      })
    }
    return book
  } catch (error) {
    console.error("Error updating book status:", error)
    throw new Error("Failed to update book status")
  }
}

export async function removeBook(bookId: string) {
  const session = await requireActiveSession()

  try {
    const book = await deleteBook(session.user.id, bookId)
    return book
  } catch (error) {
    console.error("Error deleting book:", error)
    throw new Error("Failed to delete book")
  }
}

export async function logBookReadingSession(input: LogReadingSessionInput) {
  const session = await requireActiveSession()

  try {
    return await logReadingSession(session.user.id, input)
  } catch (error) {
    console.error("Error logging reading session:", error)
    throw new Error("Failed to log reading session")
  }
}

export async function getBookTimeline(bookId: string, limit = 50) {
  const session = await requireActiveSession()

  try {
    return await getBookProgressTimeline(session.user.id, bookId, limit)
  } catch (error) {
    console.error("Error loading book timeline:", error)
    throw new Error("Failed to load progress timeline")
  }
}

export async function getWeeklyInsights() {
  const session = await requireActiveSession()

  try {
    return await getWeeklyReadingInsights(session.user.id)
  } catch (error) {
    console.error("Error loading weekly insights:", error)
    throw new Error("Failed to load weekly insights")
  }
}

export async function updateDailyGoal(pagesPerDay: number) {
  const session = await requireActiveSession()

  try {
    return await setDailyPageGoal(session.user.id, pagesPerDay)
  } catch (error) {
    console.error("Error updating daily goal:", error)
    throw new Error("Failed to update daily goal")
  }
}

export async function getBestBooksThisYear(limit = 5) {
  const session = await requireActiveSession()
  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  return db.query.books.findMany({
    where: and(
      eq(booksTable.userId, session.user.id),
      eq(booksTable.status, "read"),
      gte(booksTable.finishedAt, yearStart)
    ),
    orderBy: (table, { desc }) => [desc(table.rating), desc(table.finishedAt), desc(table.updatedAt)],
    limit,
  })
}

export async function getReadingReminders(limit = 8) {
  const session = await requireActiveSession()
  const user = await db.query.user.findFirst({ where: eq(usersTable.id, session.user.id) })

  if (!user) {
    throw new Error("User not found")
  }

  if (!user.readingReminderEnabled) {
    return {
      enabled: false,
      channel: user.readingReminderChannel,
      days: user.readingReminderDays,
      reminders: [],
    }
  }

  const reminders = await listReadingRemindersForUser(user.id, user.readingReminderDays, limit)
  return {
    enabled: true,
    channel: user.readingReminderChannel,
    days: user.readingReminderDays,
    reminders,
  }
}

export async function getBookRecommendations(limit = 8) {
  const session = await requireActiveSession()
  return listRecommendationsForUser(session.user.id, limit)
}

export type BookHighlightActionInput = {
  bookId: string
  quote: string
  page?: number | null
  highlightedAt?: string | null
}

export type UpdateBookHighlightActionInput = {
  highlightId: string
  quote: string
  page?: number | null
  highlightedAt?: string | null
}

function parseOptionalDate(value?: string | null) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date")
  }

  return parsed
}

export async function getBookHighlightsForBook(bookId: string, limit = 100) {
  const session = await requireActiveSession()

  try {
    return await getBookHighlights(session.user.id, bookId, limit)
  } catch (error) {
    console.error("Error loading book highlights:", error)
    throw new Error("Failed to load highlights")
  }
}

export async function addBookHighlightForBook(input: BookHighlightActionInput) {
  const session = await requireActiveSession()

  try {
    return await createBookHighlight(session.user.id, {
      bookId: input.bookId,
      quote: input.quote,
      page: input.page ?? null,
      highlightedAt: parseOptionalDate(input.highlightedAt),
    })
  } catch (error) {
    console.error("Error creating highlight:", error)
    throw error instanceof Error ? error : new Error("Failed to create highlight")
  }
}

export async function editBookHighlightForBook(input: UpdateBookHighlightActionInput) {
  const session = await requireActiveSession()

  try {
    return await updateBookHighlight(session.user.id, input.highlightId, {
      quote: input.quote,
      page: input.page ?? null,
      highlightedAt: parseOptionalDate(input.highlightedAt),
    })
  } catch (error) {
    console.error("Error updating highlight:", error)
    throw error instanceof Error ? error : new Error("Failed to update highlight")
  }
}

export async function removeBookHighlightForBook(highlightId: string) {
  const session = await requireActiveSession()

  try {
    return await deleteBookHighlight(session.user.id, highlightId)
  } catch (error) {
    console.error("Error deleting highlight:", error)
    throw error instanceof Error ? error : new Error("Failed to delete highlight")
  }
}

async function getBookByIdForUser(userId: string, bookId: string) {
  return db.query.books.findFirst({
    where: and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)),
  })
}
