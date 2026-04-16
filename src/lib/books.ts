import { and, desc, eq, gte, ilike, lte, ne, or } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable, bookStatuses } from "@/src/db/schema/book"

export type BookStatus = (typeof bookStatuses)[number]

export type BookInput = {
  title: string
  author: string
  totalPages?: number | null
  currentPage?: number
  status?: BookStatus
  isbn?: string | null
  coverUrl?: string | null
  notes?: string | null
  rating?: number | null
  review?: string | null
  isFavorite?: boolean
  dailyPageGoal?: number | null
  targetFinishDate?: Date | null
}

export type BookQueryFilters = {
  status?: BookStatus
  search?: string
  minPages?: number
  maxPages?: number
  minRating?: number
  maxRating?: number
  isFavorite?: boolean
  createdFrom?: Date
  createdTo?: Date
}

export type ReadingReminder = {
  id: string
  title: string
  author: string
  lastUpdatedAt: Date
  daysInactive: number
}

export type BookRecommendation = {
  title: string
  author: string
  score: number
  reason: string
  rating: number | null
  sourceBookId: string
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "about",
  "your",
  "book",
  "books",
  "read",
  "reading",
  "review",
])

function toKeywordTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
}

export async function listBooksForUser(userId: string, filters?: BookQueryFilters) {
  const conditions = [eq(booksTable.userId, userId)]

  if (filters?.status) {
    conditions.push(eq(booksTable.status, filters.status))
  }

  if (filters?.search?.trim()) {
    const searchPattern = `%${filters.search.trim()}%`
    conditions.push(
      or(
        ilike(booksTable.title, searchPattern),
        ilike(booksTable.author, searchPattern),
        ilike(booksTable.isbn, searchPattern)
      )!
    )
  }

  if (filters?.minPages !== undefined) {
    conditions.push(gte(booksTable.totalPages, filters.minPages))
  }

  if (filters?.maxPages !== undefined) {
    conditions.push(lte(booksTable.totalPages, filters.maxPages))
  }

  if (filters?.minRating !== undefined) {
    conditions.push(gte(booksTable.rating, filters.minRating))
  }

  if (filters?.maxRating !== undefined) {
    conditions.push(lte(booksTable.rating, filters.maxRating))
  }

  if (filters?.isFavorite !== undefined) {
    conditions.push(eq(booksTable.isFavorite, filters.isFavorite))
  }

  if (filters?.createdFrom) {
    conditions.push(gte(booksTable.createdAt, filters.createdFrom))
  }

  if (filters?.createdTo) {
    conditions.push(lte(booksTable.createdAt, filters.createdTo))
  }

  return db.query.books.findMany({
    where: conditions.length > 1 ? and(...conditions) : conditions[0],
    orderBy: (books, { desc }) => [desc(books.updatedAt)],
  })
}

export async function createBook(userId: string, input: BookInput) {
  const [book] = await db
    .insert(booksTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      title: input.title,
      author: input.author,
      totalPages: input.totalPages ?? null,
      currentPage: input.currentPage ?? 0,
      status: input.status ?? "to_read",
      isbn: input.isbn ?? null,
      coverUrl: input.coverUrl ?? null,
      notes: input.notes ?? null,
      rating: input.rating ?? null,
      review: input.review ?? null,
      isFavorite: input.isFavorite ?? false,
      dailyPageGoal: input.dailyPageGoal ?? null,
      targetFinishDate: input.targetFinishDate ?? null,
    })
    .returning()

  return book
}

export async function updateBookStatus(userId: string, bookId: string, status: BookStatus) {
  const [book] = await db
    .update(booksTable)
    .set({
      status,
      updatedAt: new Date(),
      finishedAt: status === "read" ? new Date() : null,
      startedAt: status === "reading" ? new Date() : undefined,
    })
    .where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)))
    .returning()

  return book
}

export async function updateBook(userId: string, bookId: string, input: Partial<BookInput>) {
  type UpdateData = {
    updatedAt: Date
    title?: string
    author?: string
    totalPages?: number | null
    currentPage?: number
    status?: BookStatus
    finishedAt?: Date | null
    startedAt?: Date | null
    isbn?: string | null
    coverUrl?: string | null
    notes?: string | null
    rating?: number | null
    review?: string | null
    isFavorite?: boolean
    dailyPageGoal?: number | null
    targetFinishDate?: Date | null
  }

  const updateData: UpdateData = { updatedAt: new Date() }

  if (input.title !== undefined) updateData.title = input.title
  if (input.author !== undefined) updateData.author = input.author
  if (input.totalPages !== undefined) updateData.totalPages = input.totalPages
  if (input.currentPage !== undefined) updateData.currentPage = input.currentPage
  if (input.status !== undefined) {
    updateData.status = input.status
    if (input.status === "read") updateData.finishedAt = new Date()
    if (input.status === "reading") updateData.startedAt = new Date()
  }
  if (input.isbn !== undefined) updateData.isbn = input.isbn
  if (input.coverUrl !== undefined) updateData.coverUrl = input.coverUrl
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.rating !== undefined) updateData.rating = input.rating
  if (input.review !== undefined) updateData.review = input.review
  if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite
  if (input.dailyPageGoal !== undefined) updateData.dailyPageGoal = input.dailyPageGoal
  if (input.targetFinishDate !== undefined) updateData.targetFinishDate = input.targetFinishDate

  const [book] = await db
    .update(booksTable)
    .set(updateData)
    .where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)))
    .returning()

  return book
}

export async function deleteBook(userId: string, bookId: string) {
  const [book] = await db
    .delete(booksTable)
    .where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)))
    .returning()

  return book
}

export async function listReadingRemindersForUser(userId: string, staleAfterDays: number, limit = 8) {
  const days = Math.max(1, Math.floor(staleAfterDays))
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const rows = await db.query.books.findMany({
    where: and(
      eq(booksTable.userId, userId),
      eq(booksTable.status, "reading"),
      lte(booksTable.updatedAt, cutoffDate)
    ),
    orderBy: [booksTable.updatedAt],
    limit,
  })

  const now = Date.now()
  return rows.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    lastUpdatedAt: book.updatedAt,
    daysInactive: Math.max(1, Math.floor((now - book.updatedAt.getTime()) / (24 * 60 * 60 * 1000))),
  }))
}

function normalizeBookKey(title: string, author: string) {
  return `${title.trim().toLowerCase()}::${author.trim().toLowerCase()}`
}

export async function listRecommendationsForUser(userId: string, limit = 8) {
  const [myFinishedBooks, myAllBooks] = await Promise.all([
    db.query.books.findMany({
      where: and(eq(booksTable.userId, userId), eq(booksTable.status, "read")),
      orderBy: [desc(booksTable.finishedAt), desc(booksTable.updatedAt)],
      limit: 80,
    }),
    db.query.books.findMany({
      where: eq(booksTable.userId, userId),
      limit: 400,
    }),
  ])

  if (myFinishedBooks.length === 0) {
    return []
  }

  const favoriteAuthors = new Set(myFinishedBooks.map((book) => book.author.trim().toLowerCase()))
  const preferenceKeywordCounts = new Map<string, number>()
  for (const book of myFinishedBooks) {
    const payload = `${book.title} ${book.notes ?? ""} ${book.review ?? ""}`
    const weight = book.rating && book.rating >= 4 ? 2 : 1
    for (const token of toKeywordTokens(payload)) {
      preferenceKeywordCounts.set(token, (preferenceKeywordCounts.get(token) ?? 0) + weight)
    }
  }

  const preferenceKeywords = new Set(
    Array.from(preferenceKeywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([token]) => token)
  )

  const myBookKeys = new Set(myAllBooks.map((book) => normalizeBookKey(book.title, book.author)))

  const pool = await db.query.books.findMany({
    where: and(eq(booksTable.status, "read"), ne(booksTable.userId, userId)),
    orderBy: [desc(booksTable.rating), desc(booksTable.updatedAt)],
    limit: 500,
  })

  const ranked: BookRecommendation[] = []
  const seen = new Set<string>()

  for (const candidate of pool) {
    const key = normalizeBookKey(candidate.title, candidate.author)
    if (seen.has(key) || myBookKeys.has(key)) {
      continue
    }

    const authorKey = candidate.author.trim().toLowerCase()
    const authorMatched = favoriteAuthors.has(authorKey)

    const candidateTokens = new Set(
      toKeywordTokens(`${candidate.title} ${candidate.notes ?? ""} ${candidate.review ?? ""}`)
    )
    const keywordOverlap = Array.from(candidateTokens).filter((token) => preferenceKeywords.has(token))

    if (!authorMatched && keywordOverlap.length === 0) {
      continue
    }

    seen.add(key)

    const authorScore = authorMatched ? 70 : 0
    const keywordScore = Math.min(30, keywordOverlap.length * 8)
    const ratingScore = Math.min(25, Math.max(0, candidate.rating ?? 0) * 5)
    const score = authorScore + keywordScore + ratingScore

    const reasons: string[] = []
    if (authorMatched) {
      reasons.push(`You finished books by ${candidate.author}`)
    }
    if (keywordOverlap.length > 0) {
      reasons.push(`matches your interests: ${keywordOverlap.slice(0, 3).join(", ")}`)
    }
    if (candidate.rating && candidate.rating >= 4) {
      reasons.push(`community rating ${candidate.rating}/5`)
    }

    const reason = reasons.join("; ")

    ranked.push({
      title: candidate.title,
      author: candidate.author,
      score,
      reason,
      rating: candidate.rating,
      sourceBookId: candidate.id,
    })

    if (ranked.length >= limit) {
      break
    }
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit)
}

export { bookStatuses }
