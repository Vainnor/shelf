import { and, eq, gte, ilike, lte, or } from "drizzle-orm"

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

export { bookStatuses }
