"use client"

import { ArrowLeft, Edit2, Trash2, BookOpen, Quote } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { booksTable } from "@/src/db/schema/book"
import type { UserRole } from "@/src/db/schema/user"
import {
  addBookHighlightForBook,
  changeBookStatus,
  editBookHighlightForBook,
  getBookHighlightsForBook,
  getBookTimeline,
  getBooks,
  logBookReadingSession,
  removeBook,
  removeBookHighlightForBook,
} from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"
import ProfileMenu from "@/src/components/auth/profile-menu"

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
type ProgressEvent = Awaited<ReturnType<typeof getBookTimeline>>[number]
type BookHighlight = Awaited<ReturnType<typeof getBookHighlightsForBook>>[number]

const statusColors = {
  to_read: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  reading: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  read: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

const statusLabels = {
  to_read: "To Read",
  reading: "Reading",
  read: "Finished",
}

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [session, setSession] = useState<Session>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [timeline, setTimeline] = useState<ProgressEvent[]>([])
  const [highlights, setHighlights] = useState<BookHighlight[]>([])
  const [highlightQuote, setHighlightQuote] = useState("")
  const [highlightPage, setHighlightPage] = useState("")
  const [highlightedDate, setHighlightedDate] = useState("")
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null)
  const [isSavingHighlight, setIsSavingHighlight] = useState(false)
  const [isDeletingHighlightId, setIsDeletingHighlightId] = useState<string | null>(null)
  const [sessionMinutes, setSessionMinutes] = useState("30")
  const [sessionPages, setSessionPages] = useState("15")
  const [sessionNotes, setSessionNotes] = useState("")
  const [isLoggingSession, setIsLoggingSession] = useState(false)

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

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      if (!session?.user?.id) return

      setLoading(true)
      try {
        const books = await getBooks()
        const foundBook = books.find((b) => b.id === bookId)
        if (!foundBook) {
          router.push("/dashboard")
          return
        }
        setBook(foundBook)
      } catch (error) {
        console.error("Error fetching book:", error)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [session?.user?.id, bookId, router])

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!session?.user?.id) return

      try {
        const items = await getBookTimeline(bookId, 30)
        setTimeline(items)
      } catch (error) {
        console.error("Error fetching timeline:", error)
      }
    }

    fetchTimeline()
  }, [session?.user?.id, bookId])

  useEffect(() => {
    const fetchHighlights = async () => {
      if (!session?.user?.id) return

      try {
        const items = await getBookHighlightsForBook(bookId, 100)
        setHighlights(items)
      } catch (error) {
        console.error("Error fetching highlights:", error)
      }
    }

    fetchHighlights()
  }, [session?.user?.id, bookId])

  const handleDelete = async () => {
    if (!book || !confirm("Are you sure you want to delete this book?")) return

    setIsDeleting(true)
    try {
      await removeBook(book.id)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Failed to delete book")
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: "to_read" | "reading" | "read") => {
    if (!book) return

    try {
      await changeBookStatus(book.id, newStatus)
      // Update local state
      setBook({ ...book, status: newStatus })
      const items = await getBookTimeline(book.id, 30)
      setTimeline(items)
      toast.success("Book status updated")
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleLogReadingSession = async () => {
    if (!book) return

    const durationMinutes = Number(sessionMinutes)
    const pagesRead = Number(sessionPages)

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      toast.error("Session minutes must be greater than zero")
      return
    }

    if (!Number.isFinite(pagesRead) || pagesRead < 0) {
      toast.error("Pages read cannot be negative")
      return
    }

    setIsLoggingSession(true)
    try {
      const result = await logBookReadingSession({
        bookId: book.id,
        durationMinutes,
        pagesRead,
        notes: sessionNotes.trim() || null,
      })

      setBook(result.book)
      setSessionNotes("")
      const items = await getBookTimeline(book.id, 30)
      setTimeline(items)
      toast.success("Reading session logged")
    } catch (error) {
      console.error("Error logging reading session:", error)
      toast.error("Failed to log reading session")
    } finally {
      setIsLoggingSession(false)
    }
  }

  const resetHighlightForm = () => {
    setEditingHighlightId(null)
    setHighlightQuote("")
    setHighlightPage("")
    setHighlightedDate("")
  }

  const reloadHighlights = async () => {
    if (!session?.user?.id) return

    const items = await getBookHighlightsForBook(bookId, 100)
    setHighlights(items)
  }

  const handleSubmitHighlight = async () => {
    if (!book) {
      return
    }

    const quote = highlightQuote.trim()
    if (!quote) {
      toast.error("Quote is required")
      return
    }

    const pageValue = highlightPage.trim()
    const parsedPage = pageValue ? Number(pageValue) : null
    if (pageValue && (parsedPage === null || !Number.isFinite(parsedPage) || parsedPage <= 0)) {
      toast.error("Page must be a positive number")
      return
    }

    setIsSavingHighlight(true)
    try {
      if (editingHighlightId) {
        await editBookHighlightForBook({
          highlightId: editingHighlightId,
          quote,
          page: parsedPage,
          highlightedAt: highlightedDate || null,
        })
        toast.success("Highlight updated")
      } else {
        await addBookHighlightForBook({
          bookId: book.id,
          quote,
          page: parsedPage,
          highlightedAt: highlightedDate || null,
        })
        toast.success("Highlight saved")
      }

      await reloadHighlights()
      resetHighlightForm()
    } catch (error) {
      console.error("Error saving highlight:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save highlight")
    } finally {
      setIsSavingHighlight(false)
    }
  }

  const handleEditHighlight = (highlight: BookHighlight) => {
    setEditingHighlightId(highlight.id)
    setHighlightQuote(highlight.quote)
    setHighlightPage(highlight.page ? String(highlight.page) : "")
    setHighlightedDate(
      highlight.highlightedAt ? new Date(highlight.highlightedAt).toISOString().slice(0, 10) : ""
    )
  }

  const handleDeleteHighlight = async (highlightId: string) => {
    if (!confirm("Delete this highlight?")) return

    setIsDeletingHighlightId(highlightId)
    try {
      await removeBookHighlightForBook(highlightId)
      await reloadHighlights()
      if (editingHighlightId === highlightId) {
        resetHighlightForm()
      }
      toast.success("Highlight deleted")
    } catch (error) {
      console.error("Error deleting highlight:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete highlight")
    } finally {
      setIsDeletingHighlightId(null)
    }
  }

  function formatEventLabel(event: ProgressEvent) {
    switch (event.eventType) {
      case "session_logged":
        return `Session logged${event.fromPage !== null && event.toPage !== null ? ` (${event.fromPage} -> ${event.toPage})` : ""}`
      case "page_update":
        return `Page update (${event.fromPage ?? "-"} -> ${event.toPage ?? "-"})`
      case "status_change":
        return `Status changed (${event.fromStatus ?? "-"} -> ${event.toStatus ?? "-"})`
      case "rating_updated":
        return `Rating updated (${event.rating ?? "-"}/5)`
      case "review_updated":
        return "Review updated"
      default:
        return event.eventType
    }
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-4xl">
          <div className="text-center text-muted-foreground">Loading book details...</div>
        </section>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-4xl">
          <Button variant="outline" onClick={() => router.back()} className="gap-2 mb-6">
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Book not found</p>
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  const progressPercent = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0
  const formattedStartDate = book.startedAt ? new Date(book.startedAt).toLocaleDateString() : null
  const formattedFinishDate = book.finishedAt ? new Date(book.finishedAt).toLocaleDateString() : null

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <ProfileMenu
            name={session?.user?.name ?? ""}
            email={session?.user?.email ?? ""}
            image={session?.user?.image}
            isAdmin={session?.user?.role === "admin"}
            username={session?.user?.username}
          />
        </div>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Book Cover */}
          <div className="md:col-span-1">
            {book.coverUrl ? (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[2/3] rounded-lg bg-muted flex items-center justify-center">
                <BookOpen className="size-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Title and basic info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
                <p className="text-lg text-muted-foreground">{book.author}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[book.status]}>
                  {statusLabels[book.status as keyof typeof statusLabels]}
                </Badge>
                {book.isbn && <Badge variant="outline">ISBN: {book.isbn}</Badge>}
              </div>
            </div>

            {/* Status buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Change Status:</p>
              <div className="flex gap-2 flex-wrap">
                {(["to_read", "reading", "read"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={book.status === status ? "default" : "outline"}
                    onClick={() => handleStatusChange(status)}
                  >
                    {statusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Progress */}
            {book.totalPages && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reading Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{book.currentPage} pages read</span>
                      <span className="text-muted-foreground">of {book.totalPages} pages</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{progressPercent}% Complete</div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log reading session</CardTitle>
                <CardDescription>Track time spent reading and pages completed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min={1}
                    value={sessionMinutes}
                    onChange={(event) => setSessionMinutes(event.target.value)}
                    placeholder="Minutes"
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    value={sessionPages}
                    onChange={(event) => setSessionPages(event.target.value)}
                    placeholder="Pages read"
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
                <textarea
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  placeholder="Optional session notes"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button onClick={handleLogReadingSession} disabled={isLoggingSession}>
                  {isLoggingSession ? "Logging..." : "Log session"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Quote className="size-4" />
                  Highlights and quotes
                </CardTitle>
                <CardDescription>
                  Save memorable lines with an optional page number and highlight date.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={highlightQuote}
                  onChange={(event) => setHighlightQuote(event.target.value)}
                  placeholder="Write the quote or highlight text"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={1}
                    value={highlightPage}
                    onChange={(event) => setHighlightPage(event.target.value)}
                    placeholder="Page (optional)"
                  />
                  <Input
                    type="date"
                    value={highlightedDate}
                    onChange={(event) => setHighlightedDate(event.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSubmitHighlight} disabled={isSavingHighlight}>
                    {isSavingHighlight
                      ? (editingHighlightId ? "Saving..." : "Adding...")
                      : (editingHighlightId ? "Save highlight" : "Add highlight")}
                  </Button>
                  {editingHighlightId ? (
                    <Button variant="outline" onClick={resetHighlightForm} disabled={isSavingHighlight}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {highlights.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No highlights yet.</p>
                  ) : (
                    highlights.map((highlight) => (
                      <div key={highlight.id} className="rounded-md border border-border/70 px-3 py-3 text-sm">
                        <p className="whitespace-pre-wrap leading-6">{`"${highlight.quote}"`}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {highlight.page ? <span>Page {highlight.page}</span> : null}
                          {highlight.highlightedAt ? (
                            <span>Highlighted {new Date(highlight.highlightedAt).toLocaleDateString()}</span>
                          ) : null}
                          <span>Saved {new Date(highlight.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditHighlight(highlight)}
                            disabled={isSavingHighlight || isDeletingHighlightId === highlight.id}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteHighlight(highlight.id)}
                            disabled={isDeletingHighlightId === highlight.id}
                          >
                            {isDeletingHighlightId === highlight.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Added:</span>
                  <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                </div>
                {formattedStartDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{formattedStartDate}</span>
                  </div>
                )}
                {formattedFinishDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Finished:</span>
                    <span>{formattedFinishDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard?edit=${book.id}`)}
                className="gap-2"
              >
                <Edit2 className="size-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {book.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{book.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress timeline</CardTitle>
            <CardDescription>Recent progress events for this book.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline events yet.</p>
            ) : (
              timeline.map((event) => (
                <div key={event.id} className="rounded-md border border-border/70 px-3 py-2 text-sm">
                  <p className="font-medium">{formatEventLabel(event)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                  {event.details ? <p className="mt-1 text-xs text-muted-foreground">{event.details}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

