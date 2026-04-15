import { and, eq } from "drizzle-orm"

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
}

export async function listBooksForUser(userId: string, status?: BookStatus) {
  if (status) {
    return db.query.books.findMany({
      where: (books, { and, eq }) => and(eq(books.userId, userId), eq(books.status, status)),
      orderBy: (books, { desc }) => [desc(books.updatedAt)],
    })
  }

  return db.query.books.findMany({
    where: eq(booksTable.userId, userId),
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

export async function deleteBook(userId: string, bookId: string) {
  const [book] = await db
    .delete(booksTable)
    .where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)))
    .returning()

  return book
}


export { bookStatuses }

