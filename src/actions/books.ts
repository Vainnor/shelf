"use server"

import { getActiveSession } from "@/src/lib/session"
import {
  listBooksForUser,
  createBook,
  updateBook,
  updateBookStatus,
  deleteBook,
  type BookStatus,
  type BookInput,
} from "@/src/lib/books"

async function requireActiveSession() {
  const activeSession = await getActiveSession()
  if (!activeSession) {
    throw new Error("Unauthorized")
  }

  return activeSession.session
}

export async function getBooks(status?: BookStatus) {
  const session = await requireActiveSession()

  try {
    const books = await listBooksForUser(session.user.id, status)
    return books
  } catch (error) {
    console.error("Error fetching books:", error)
    throw new Error("Failed to fetch books")
  }
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
    const book = await updateBook(session.user.id, bookId, input)
    return book
  } catch (error) {
    console.error("Error updating book:", error)
    throw new Error("Failed to update book")
  }
}

export async function changeBookStatus(bookId: string, status: BookStatus) {
  const session = await requireActiveSession()

  try {
    const book = await updateBookStatus(session.user.id, bookId, status)
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

