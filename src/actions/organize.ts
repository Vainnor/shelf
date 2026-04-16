"use server"

import { and, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import {
  bookTagsTable,
  collectionBooksTable,
  collectionsTable,
  tagsTable,
} from "@/src/db/schema/reading"
import { getActiveSession } from "@/src/lib/session"

async function requireActiveSession() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    throw new Error("Unauthorized")
  }

  return activeSession.session
}

export async function createTag(name: string) {
  const session = await requireActiveSession()
  const normalized = name.trim()

  if (!normalized) {
    throw new Error("Tag name is required")
  }

  const [tag] = await db
    .insert(tagsTable)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: normalized,
    })
    .onConflictDoNothing({ target: [tagsTable.userId, tagsTable.name] })
    .returning()

  return tag ?? null
}

export async function listTags() {
  const session = await requireActiveSession()
  return db.query.tags.findMany({
    where: eq(tagsTable.userId, session.user.id),
    orderBy: (table, { asc }) => [asc(table.name)],
  })
}

export async function addTagToBook(bookId: string, tagId: string) {
  const session = await requireActiveSession()

  const book = await db.query.books.findFirst({
    where: and(eq(booksTable.id, bookId), eq(booksTable.userId, session.user.id)),
  })
  if (!book) {
    throw new Error("Book not found")
  }

  const tag = await db.query.tags.findFirst({
    where: and(eq(tagsTable.id, tagId), eq(tagsTable.userId, session.user.id)),
  })
  if (!tag) {
    throw new Error("Tag not found")
  }

  const [entry] = await db
    .insert(bookTagsTable)
    .values({
      id: crypto.randomUUID(),
      bookId,
      tagId,
    })
    .onConflictDoNothing({ target: [bookTagsTable.bookId, bookTagsTable.tagId] })
    .returning()

  return entry ?? null
}

export async function removeTagFromBook(bookId: string, tagId: string) {
  await requireActiveSession()

  const [deleted] = await db
    .delete(bookTagsTable)
    .where(and(eq(bookTagsTable.bookId, bookId), eq(bookTagsTable.tagId, tagId)))
    .returning()

  return deleted ?? null
}

export async function createCollection(input: { name: string; description?: string | null }) {
  const session = await requireActiveSession()
  const name = input.name.trim()

  if (!name) {
    throw new Error("Collection name is required")
  }

  const [collection] = await db
    .insert(collectionsTable)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      description: input.description?.trim() || null,
    })
    .onConflictDoNothing({ target: [collectionsTable.userId, collectionsTable.name] })
    .returning()

  return collection ?? null
}

export async function listCollections() {
  const session = await requireActiveSession()
  return db.query.collections.findMany({
    where: eq(collectionsTable.userId, session.user.id),
    orderBy: (table, { asc }) => [asc(table.name)],
  })
}

export async function addBookToCollection(collectionId: string, bookId: string, position?: number | null) {
  const session = await requireActiveSession()

  const collection = await db.query.collections.findFirst({
    where: and(eq(collectionsTable.id, collectionId), eq(collectionsTable.userId, session.user.id)),
  })
  if (!collection) {
    throw new Error("Collection not found")
  }

  const book = await db.query.books.findFirst({
    where: and(eq(booksTable.id, bookId), eq(booksTable.userId, session.user.id)),
  })
  if (!book) {
    throw new Error("Book not found")
  }

  const [entry] = await db
    .insert(collectionBooksTable)
    .values({
      id: crypto.randomUUID(),
      collectionId,
      bookId,
      position: position ?? null,
    })
    .onConflictDoNothing({ target: [collectionBooksTable.collectionId, collectionBooksTable.bookId] })
    .returning()

  return entry ?? null
}

export async function removeBookFromCollection(collectionId: string, bookId: string) {
  await requireActiveSession()

  const [deleted] = await db
    .delete(collectionBooksTable)
    .where(and(eq(collectionBooksTable.collectionId, collectionId), eq(collectionBooksTable.bookId, bookId)))
    .returning()

  return deleted ?? null
}

