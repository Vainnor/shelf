"use client"

import { BookOpen, Plus, UserRound, X } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import ProfileMenu from "@/src/components/auth/profile-menu"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { BookCard, BookForm } from "@/src/components/books"
import type { BookInput, BookStatus } from "@/src/lib/books"
import type { booksTable } from "@/src/db/schema/book"
import {
  getBooks,
  addBook,
  editBook,
  changeBookStatus,
  removeBook,
} from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"

export const dynamic = "force-dynamic"

type Book = typeof booksTable.$inferSelect
type Session = {
  user: { id: string; email: string; name?: string; image?: string | null; role?: "user" | "admin" }
} | null

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<"updated" | "title" | "author">("updated")
  const [filterStatus, setFilterStatus] = useState<BookStatus | "all">("all")
  const [error, setError] = useState<string | null>(null)

  const displayName = session?.user?.name ?? session?.user?.email ?? "Guest"

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSession()
        if (!sessionData) {
          router.push("/login")
          return
        }
        setSession(sessionData)
      } catch (error) {
        console.error("Error fetching session:", error)
        router.push("/login")
      }
    }

    fetchSession()
  }, [router])

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBooks(filterStatus !== "all" ? filterStatus : undefined)
      setBooks(data)
    } catch (error) {
      console.error("Error fetching books:", error)
      setError("Failed to load books")
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (session?.user?.id) {
      fetchBooks()
    }
  }, [session, fetchBooks])

  const handleAddBook = async (data: BookInput) => {
    setSubmitting(true)
    setError(null)
    try {
      await addBook(data)
      await fetchBooks()
      setShowForm(false)
      toast.success("Book added to your library.")
    } catch (error) {
      console.error("Error adding book:", error)
      setError("Failed to add book")
      toast.error("Failed to add book")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBook = async (data: BookInput) => {
    if (!selectedBook) return
    setSubmitting(true)
    setError(null)
    try {
      await editBook(selectedBook.id, data)
      await fetchBooks()
      setShowForm(false)
      setSelectedBook(undefined)
      toast.success("Book updated.")
    } catch (error) {
      console.error("Error updating book:", error)
      setError("Failed to update book")
      toast.error("Failed to update book")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return

    try {
      await removeBook(bookId)
      await fetchBooks()
    } catch (error) {
      console.error("Error deleting book:", error)
      setError("Failed to delete book")
      alert("Failed to delete book")
    }
  }

  const handleStatusChange = async (bookId: string, newStatus: BookStatus) => {
    try {
      await changeBookStatus(bookId, newStatus)
      await fetchBooks()
    } catch (error) {
      console.error("Error updating status:", error)
      setError("Failed to update status")
      alert("Failed to update status")
    }
  }

  const sortBooks = (booksToSort: Book[]) => {
    const sorted = [...booksToSort]
    switch (sortBy) {
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case "author":
        return sorted.sort((a, b) => a.author.localeCompare(b.author))
      case "updated":
      default:
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }
  }

  const groupedBooks = {
    to_read: sortBooks(books.filter((b) => b.status === "to_read")),
    reading: sortBooks(books.filter((b) => b.status === "reading")),
    read: sortBooks(books.filter((b) => b.status === "read")),
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <BookOpen className="size-3.5" />
              Dashboard
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, {displayName}
            </h1>
            <p className="text-muted-foreground">
              Manage your to-read, currently reading, and finished books in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => {
              setSelectedBook(undefined)
              setShowForm(!showForm)
            }} className="gap-2">
              <Plus className="size-4" />
              Add book
            </Button>
            <Button variant="outline" onClick={() => router.push("/library")} className="gap-2">
              <BookOpen className="size-4" />
              <span className="hidden sm:inline">Library</span>
            </Button>
            <ProfileMenu
              name={session?.user?.name ?? ""}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
            />
          </div>
        </div>

        {showForm && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedBook ? "Edit Book" : "Add New Book"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false)
                  setSelectedBook(undefined)
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
            <BookForm
              book={selectedBook}
              onSubmit={selectedBook ? handleUpdateBook : handleAddBook}
              onCancel={() => {
                setShowForm(false)
                setSelectedBook(undefined)
              }}
              isLoading={submitting}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "updated" | "title" | "author")}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="updated">Sort: Recently Updated</option>
              <option value="title">Sort: Title</option>
              <option value="author">Sort: Author</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as BookStatus | "all")}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="all">Filter: All</option>
              <option value="to_read">Filter: To Read</option>
              <option value="reading">Filter: Reading</option>
              <option value="read">Filter: Finished</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            {books.length} book{books.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading books...</div>
        ) : books.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No books yet. Add your first book to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {(["to_read", "reading", "read"] as const).map((status) => (
              <div key={status}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                  {status === "to_read" && "📚 To Read"}
                  {status === "reading" && "📖 Currently Reading"}
                  {status === "read" && "✓ Finished"}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({groupedBooks[status].length})
                  </span>
                </h2>
                {groupedBooks[status].length === 0 ? (
                  <p className="text-sm text-muted-foreground">No books in this category yet.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {groupedBooks[status].map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onView={(b) => router.push(`/books/${b.id}`)}
                        onEdit={(b) => {
                          setSelectedBook(b)
                          setShowForm(true)
                        }}
                        onDelete={handleDeleteBook}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

