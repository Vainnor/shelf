"use client"

import { BookOpen, Plus, X } from "lucide-react"
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
import type { UserRole } from "@/src/db/schema/user"
import {
  getBooks,
  addBook,
  editBook,
  changeBookStatus,
  removeBook,
  getBestBooksThisYear,
  getWeeklyInsights,
} from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"

export const dynamic = "force-dynamic"

type Book = typeof booksTable.$inferSelect
type Session = {
  user: {
    id: string
    email: string
    name?: string
    image?: string | null
    role?: UserRole
    username?: string | null
  }
} | null
type WeeklyInsights = Awaited<ReturnType<typeof getWeeklyInsights>> | null

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
  const [searchQuery, setSearchQuery] = useState("")
  const [minPages, setMinPages] = useState("")
  const [maxPages, setMaxPages] = useState("")
  const [minRating, setMinRating] = useState("")
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsights>(null)
  const [bestBooks, setBestBooks] = useState<Book[]>([])

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
      const filters = {
        status: filterStatus !== "all" ? filterStatus : undefined,
        search: searchQuery.trim() || undefined,
        minPages: minPages ? Number(minPages) : undefined,
        maxPages: maxPages ? Number(maxPages) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        isFavorite: favoriteOnly ? true : undefined,
        createdFrom: createdFrom ? new Date(`${createdFrom}T00:00:00`) : undefined,
        createdTo: createdTo ? new Date(`${createdTo}T23:59:59`) : undefined,
      }

      const data = await getBooks(filters)
      setBooks(data)
    } catch (error) {
      console.error("Error fetching books:", error)
      setError("Failed to load books")
    } finally {
      setLoading(false)
    }
  }, [filterStatus, searchQuery, minPages, maxPages, minRating, favoriteOnly, createdFrom, createdTo])

  const fetchDashboardInsights = useCallback(async () => {
    try {
      const [insights, topBooks] = await Promise.all([getWeeklyInsights(), getBestBooksThisYear(5)])
      setWeeklyInsights(insights)
      setBestBooks(topBooks)
    } catch (error) {
      console.error("Error fetching dashboard insights:", error)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchBooks()
      fetchDashboardInsights()
    }
  }, [session, fetchBooks, fetchDashboardInsights])

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

  const handleEditBook = (book: Book) => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setSelectedBook(book)
    setShowForm(true)
  }

  const handleAddBookClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setSelectedBook(undefined)
    setShowForm(true)
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
            <Button onClick={handleAddBookClick} className="gap-2">
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
              username={session?.user?.username}
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
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, author, ISBN"
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {books.length} book{books.length !== 1 ? "s" : ""}
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            type="number"
            min={0}
            value={minPages}
            onChange={(event) => setMinPages(event.target.value)}
            placeholder="Min pages"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="number"
            min={0}
            value={maxPages}
            onChange={(event) => setMaxPages(event.target.value)}
            placeholder="Max pages"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="number"
            min={1}
            max={5}
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            placeholder="Min rating"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="date"
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="date"
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <input
              type="checkbox"
              checked={favoriteOnly}
              onChange={(event) => setFavoriteOnly(event.target.checked)}
              className="size-4"
            />
            Favorites only
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly insights</CardTitle>
              <CardDescription>Your reading momentum over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <p className="text-sm"><span className="font-medium">Sessions:</span> {weeklyInsights?.sessionsCount ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Pages read:</span> {weeklyInsights?.pagesRead ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Minutes read:</span> {weeklyInsights?.minutesRead ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Current streak:</span> {weeklyInsights?.currentStreak ?? 0} day(s)</p>
              <p className="text-sm"><span className="font-medium">Active days:</span> {weeklyInsights?.activeDays ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Daily goal:</span> {weeklyInsights?.dailyPageGoal ?? 0} pages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best books this year</CardTitle>
              <CardDescription>Top completed books ranked by rating.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {bestBooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed rated books yet.</p>
              ) : (
                bestBooks.map((book) => (
                  <div key={book.id} className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2 text-sm">
                    <button className="text-left hover:underline" onClick={() => router.push(`/books/${book.id}`)}>
                      {book.title}
                    </button>
                    <span className="font-medium">{book.rating ?? "-"}/5</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
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
                        onEdit={handleEditBook}
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

