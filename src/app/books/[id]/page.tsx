"use client"

import { ArrowLeft, Edit2, Quote } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/src/components/ui/button"
import ConfirmDeleteButton from "@/src/components/ui/confirm-delete-button"
import { Input } from "@/src/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { BookVisualSummary, statusLabels } from "@/src/components/books"
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
import NotificationsButton from "@/src/components/notifications/notifications-button"

export const dynamic = "force-dynamic"

type Book = typeof booksTable.$inferSelect
type Session = {
  user: {
    id: string
    email: string
    name?: string
    image?: string | null
    role?: UserRole
  }
} | null
type ProgressEvent = Awaited<ReturnType<typeof getBookTimeline>>[number]
type BookHighlight = Awaited<ReturnType<typeof getBookHighlightsForBook>>[number]


const STORAGE_TIME_MODE_KEY = "shelf.books.log.timeMode.v1"
const STORAGE_DURATION_MODE_KEY = "shelf.books.log.durationMode.v1"
const STORAGE_PAGE_MODE_KEY = "shelf.books.log.pageMode.v1"

function formatDateTimeLocal(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
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
  const [timeMode, setTimeMode] = useState<"duration" | "range">("duration")
  const [durationMode, setDurationMode] = useState<"minutes" | "hours_minutes">("minutes")
  const [sessionMinutes, setSessionMinutes] = useState("30")
  const [sessionHours, setSessionHours] = useState("0")
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")
  const [pageMode, setPageMode] = useState<"pages" | "end_page">("pages")
  const [sessionPages, setSessionPages] = useState("15")
  const [sessionEndPage, setSessionEndPage] = useState("")
  const [sessionNotes, setSessionNotes] = useState("")
  const [isLoggingSession, setIsLoggingSession] = useState(false)
  const [selectorPrefsHydrated, setSelectorPrefsHydrated] = useState(false)

  useEffect(() => {
    try {
      const persistedTimeMode = window.localStorage.getItem(STORAGE_TIME_MODE_KEY)
      const persistedDurationMode = window.localStorage.getItem(STORAGE_DURATION_MODE_KEY)
      const persistedPageMode = window.localStorage.getItem(STORAGE_PAGE_MODE_KEY)

      if (persistedTimeMode === "duration" || persistedTimeMode === "range") {
        setTimeMode(persistedTimeMode)
      }

      if (persistedDurationMode === "minutes" || persistedDurationMode === "hours_minutes") {
        setDurationMode(persistedDurationMode)
      }

      if (persistedPageMode === "pages" || persistedPageMode === "end_page") {
        setPageMode(persistedPageMode)
      }
    } catch {
      // Ignore unavailable storage (private mode / blocked storage).
    } finally {
      setSelectorPrefsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!selectorPrefsHydrated) return

    try {
      window.localStorage.setItem(STORAGE_TIME_MODE_KEY, timeMode)
    } catch {
      // Ignore unavailable storage (private mode / blocked storage).
    }
  }, [selectorPrefsHydrated, timeMode])

  useEffect(() => {
    if (!selectorPrefsHydrated) return

    try {
      window.localStorage.setItem(STORAGE_DURATION_MODE_KEY, durationMode)
    } catch {
      // Ignore unavailable storage (private mode / blocked storage).
    }
  }, [selectorPrefsHydrated, durationMode])

  useEffect(() => {
    if (!selectorPrefsHydrated) return

    try {
      window.localStorage.setItem(STORAGE_PAGE_MODE_KEY, pageMode)
    } catch {
      // Ignore unavailable storage (private mode / blocked storage).
    }
  }, [selectorPrefsHydrated, pageMode])

  useEffect(() => {
    if (timeMode !== "range") return
    if (rangeStart || rangeEnd) return

    const now = new Date()
    const start = new Date(now.getTime() - 30 * 60 * 1000)
    setRangeStart(formatDateTimeLocal(start))
    setRangeEnd(formatDateTimeLocal(now))
  }, [timeMode, rangeStart, rangeEnd])

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
    if (!book) return

    setIsDeleting(true)
    try {
      await removeBook(book.id)
      toast.success("Book deleted")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting book:", error)
      toast.error("Failed to delete book")
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

    const minutesValue = sessionMinutes.trim()
    const hoursValue = sessionHours.trim()
    const pagesValue = sessionPages.trim()
    const endPageValue = sessionEndPage.trim()

    if (timeMode === "duration") {
      if (durationMode === "minutes") {
        if (!minutesValue) {
          toast.error("Enter total minutes")
          return
        }
      } else if (!hoursValue && !minutesValue) {
        toast.error("Enter hours and/or minutes")
        return
      }
    } else if (!rangeStart || !rangeEnd) {
      toast.error("Select a start and end time")
      return
    }

    if (pageMode === "pages") {
      if (!pagesValue) {
        toast.error("Enter pages read")
        return
      }
    } else if (!endPageValue) {
      toast.error("Enter the page you ended on")
      return
    }

    setIsLoggingSession(true)
    try {
      const result = await logBookReadingSession({
        bookId: book.id,
        timeMode,
        durationMinutes: minutesValue ? Number(minutesValue) : undefined,
        durationHours: durationMode === "hours_minutes" && hoursValue ? Number(hoursValue) : undefined,
        startTime: timeMode === "range" ? rangeStart : undefined,
        endTime: timeMode === "range" ? rangeEnd : undefined,
        pageMode,
        pagesRead: pageMode === "pages" && pagesValue ? Number(pagesValue) : undefined,
        endPage: pageMode === "end_page" && endPageValue ? Number(endPageValue) : undefined,
        notes: sessionNotes.trim() || null,
      })

      setBook(result.book)
      setRangeStart("")
      setRangeEnd("")
      setSessionEndPage("")
      setSessionNotes("")
      const items = await getBookTimeline(book.id, 30)
      setTimeline(items)
      toast.success("Reading session logged")
    } catch (error) {
      console.error("Error logging reading session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to log reading session")
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

  const formattedStartDate = book.startedAt ? new Date(book.startedAt).toLocaleDateString() : null
  const formattedFinishDate = book.finishedAt ? new Date(book.finishedAt).toLocaleDateString() : null

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <ProfileMenu
              name={session?.user?.name ?? ""}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
            />
          </div>
        </div>

        {/* Hero */}
        <Card>
          <CardContent className="space-y-6 p-5 sm:p-6">
            <BookVisualSummary
              title={book.title}
              author={book.author}
              status={book.status}
              currentPage={book.currentPage}
              totalPages={book.totalPages}
              coverUrl={book.coverUrl}
              isbn={book.isbn}
              isFavorite={book.isFavorite}
              variant="hero"
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Change Status</p>
                    <div className="flex flex-wrap gap-2">
                      {(["to_read", "reading", "read"] as const).map((status) => (
                        <Button
                          key={status}
                          variant={book.status === status ? "default" : "outline"}
                          onClick={() => handleStatusChange(status)}
                          className="h-9 min-w-28 justify-center"
                        >
                          {statusLabels[status]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:ml-auto md:w-36">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/books/${book.id}/edit`)}
                      className="w-full justify-center gap-2"
                    >
                      <Edit2 className="size-4" />
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      variant="outline"
                      onConfirmAction={handleDelete}
                      disabled={isDeleting}
                      className="w-full justify-center gap-2"
                      pendingLabel="Deleting..."
                      label="Delete"
                    />
                  </div>
                </div>

                <div className="grid gap-2 pt-2 text-sm sm:grid-cols-3">
                  <div className="rounded-md border border-border/70 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Added</p>
                    <p className="mt-1 font-medium">{new Date(book.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-md border border-border/70 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Started</p>
                    <p className="mt-1 font-medium">{formattedStartDate ?? "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/70 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Finished</p>
                    <p className="mt-1 font-medium">{formattedFinishDate ?? "-"}</p>
                  </div>
                </div>
              </div>
            </BookVisualSummary>
          </CardContent>
        </Card>

        {/* Main sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
              <CardHeader>
                <CardTitle className="text-base">Log reading session</CardTitle>
                <CardDescription>Track time spent reading and pages completed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 rounded-md border border-border/70 p-3">
                  <p className="text-sm font-medium">Time</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={timeMode === "duration" ? "default" : "outline"}
                      onClick={() => setTimeMode("duration")}
                    >
                      Total duration
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={timeMode === "range" ? "default" : "outline"}
                      onClick={() => setTimeMode("range")}
                    >
                      Start + end time
                    </Button>
                  </div>

                  {timeMode === "duration" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={durationMode === "minutes" ? "default" : "outline"}
                          onClick={() => setDurationMode("minutes")}
                        >
                          Minutes only
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={durationMode === "hours_minutes" ? "default" : "outline"}
                          onClick={() => setDurationMode("hours_minutes")}
                        >
                          Hours + minutes
                        </Button>
                      </div>

                      {durationMode === "minutes" ? (
                        <Input
                          type="number"
                          min={1}
                          value={sessionMinutes}
                          onChange={(event) => setSessionMinutes(event.target.value)}
                          placeholder="Total minutes"
                        />
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            type="number"
                            min={0}
                            value={sessionHours}
                            onChange={(event) => setSessionHours(event.target.value)}
                            placeholder="Hours"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={sessionMinutes}
                            onChange={(event) => setSessionMinutes(event.target.value)}
                            placeholder="Minutes"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        type="datetime-local"
                        value={rangeStart}
                        onChange={(event) => setRangeStart(event.target.value)}
                      />
                      <Input
                        type="datetime-local"
                        value={rangeEnd}
                        onChange={(event) => setRangeEnd(event.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-md border border-border/70 p-3">
                  <p className="text-sm font-medium">Pages</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={pageMode === "pages" ? "default" : "outline"}
                      onClick={() => setPageMode("pages")}
                    >
                      Total pages read
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={pageMode === "end_page" ? "default" : "outline"}
                      onClick={() => setPageMode("end_page")}
                    >
                      End page
                    </Button>
                  </div>

                  {pageMode === "pages" ? (
                    <Input
                      type="number"
                      min={0}
                      value={sessionPages}
                      onChange={(event) => setSessionPages(event.target.value)}
                      placeholder="Pages read"
                    />
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      value={sessionEndPage}
                      onChange={(event) => setSessionEndPage(event.target.value)}
                      placeholder={`Ended on page (currently ${book.currentPage})`}
                    />
                  )}
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
                          <ConfirmDeleteButton
                            variant="outline"
                            size="sm"
                            onConfirmAction={() => handleDeleteHighlight(highlight.id)}
                            label="Delete"
                            pendingLabel="Deleting..."
                            disabled={isDeletingHighlightId === highlight.id}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
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

