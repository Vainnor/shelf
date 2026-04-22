"use client"

import { AlarmClock, BookOpen, ChevronDown, Plus, Sparkles } from "lucide-react"
import { useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import ProfileMenu from "@/src/components/auth/profile-menu"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import ConfirmDeleteButton from "@/src/components/ui/confirm-delete-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { BookStatus } from "@/src/lib/books"
import type { booksTable } from "@/src/db/schema/book"
import type { UserRole } from "@/src/db/schema/user"
import {
  getBooks,
  changeBookStatus,
  removeBook,
  getBestBooksThisYear,
  getBookRecommendations,
  getWeeklyInsights,
  getReadingGoalsV2,
  updateReadingGoalsV2,
  submitRecommendationFeedback,
} from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"
import { cn } from "@/src/lib/utils"

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
type WeeklyInsights = Awaited<ReturnType<typeof getWeeklyInsights>> | null
type BookRecommendations = Awaited<ReturnType<typeof getBookRecommendations>>
type ReadingGoalsV2 = Awaited<ReturnType<typeof getReadingGoalsV2>> | null

type DropdownSectionProps = {
  title: string
  description: string
  defaultOpen?: boolean
  children: ReactNode
}

function DropdownSection({ title, description, defaultOpen = true, children }: DropdownSectionProps) {
  return (
    <details open={defaultOpen} className="group overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <summary className="list-none cursor-pointer px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <CardContent className="border-t border-border/70 px-5 pb-5 pt-4">{children}</CardContent>
    </details>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
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
  const [recommendations, setRecommendations] = useState<BookRecommendations>([])
  const [readingGoals, setReadingGoals] = useState<ReadingGoalsV2>(null)
  const [yearlyTargetInput, setYearlyTargetInput] = useState(0)
  const [monthlyTargetInput, setMonthlyTargetInput] = useState(0)
  const [savingGoals, setSavingGoals] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState<Record<BookStatus, boolean>>({
    to_read: true,
    reading: true,
    read: true,
  })

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
      const [insights, topBooks, recommendationData, goalsData] = await Promise.all([
        getWeeklyInsights(),
        getBestBooksThisYear(5),
        getBookRecommendations(6),
        getReadingGoalsV2(),
      ])
      setWeeklyInsights(insights)
      setBestBooks(topBooks)
      setRecommendations(recommendationData)
      setReadingGoals(goalsData)
      setYearlyTargetInput(goalsData.yearlyTarget ?? 0)
      setMonthlyTargetInput(goalsData.monthlyTarget ?? 0)
    } catch (error) {
      console.error("Error fetching dashboard insights:", error)
    }
  }, [])

  const handleSaveGoals = async () => {
    setSavingGoals(true)
    try {
      await updateReadingGoalsV2({
        yearlyTarget: yearlyTargetInput > 0 ? yearlyTargetInput : null,
        monthlyTarget: monthlyTargetInput > 0 ? monthlyTargetInput : null,
      })
      const goalsData = await getReadingGoalsV2()
      setReadingGoals(goalsData)
      toast.success("Goals updated")
    } catch (error) {
      console.error("Error updating goals:", error)
      toast.error("Failed to update goals")
    } finally {
      setSavingGoals(false)
    }
  }

  const handleRecommendationFeedback = async (
    input: { sourceBookId: string; title: string; author: string; feedbackType: "not_interested" | "already_read" }
  ) => {
    setRecommendations((current) => current.filter((item) => item.sourceBookId !== input.sourceBookId))
    try {
      await submitRecommendationFeedback(input)
      toast.success("Recommendation feedback saved")
    } catch (error) {
      console.error("Error saving recommendation feedback:", error)
      toast.error("Failed to save recommendation feedback")
      const refreshed = await getBookRecommendations(6)
      setRecommendations(refreshed)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchBooks()
      fetchDashboardInsights()
    }
  }, [session, fetchBooks, fetchDashboardInsights])

  const handleDeleteBook = async (bookId: string) => {
    try {
      await removeBook(bookId)
      await fetchBooks()
      toast.success("Book deleted")
    } catch (error) {
      console.error("Error deleting book:", error)
      setError("Failed to delete book")
      toast.error("Failed to delete book")
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

  const handleAddBookClick = () => {
    router.push("/books/new")
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

          <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
            <Button onClick={handleAddBookClick} className="gap-2">
              <Plus className="size-4" />
              Add book
            </Button>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
              <Button variant="outline" onClick={() => router.push("/library")} className="gap-2">
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Library</span>
              </Button>
              <Button variant="outline" onClick={() => router.push("/board")} className="gap-2">
                <span className="hidden sm:inline">Board</span>
                <span className="sm:hidden">Board</span>
              </Button>
              <Button variant="outline" onClick={() => router.push("/timer")} className="gap-2">
                <AlarmClock className="size-4" />
                <span className="hidden sm:inline">Timer</span>
                <span className="sm:hidden">Timer</span>
              </Button>
              <NotificationsButton />
              <ProfileMenu
                name={session?.user?.name ?? ""}
                email={session?.user?.email ?? ""}
                image={session?.user?.image}
                isAdmin={session?.user?.role === "admin"}
              />
            </div>
          </div>
        </div>

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

        <div className="grid gap-3 lg:grid-cols-2">
          <DropdownSection
            title="Weekly insights"
            description="Your reading momentum over the last 7 days."
            defaultOpen={false}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="text-sm"><span className="font-medium">Sessions:</span> {weeklyInsights?.sessionsCount ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Pages read:</span> {weeklyInsights?.pagesRead ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Minutes read:</span> {weeklyInsights?.minutesRead ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Current streak:</span> {weeklyInsights?.currentStreak ?? 0} day(s)</p>
              <p className="text-sm"><span className="font-medium">Active days:</span> {weeklyInsights?.activeDays ?? 0}</p>
              <p className="text-sm"><span className="font-medium">Daily goal:</span> {weeklyInsights?.dailyPageGoal ?? 0} pages</p>
            </div>
          </DropdownSection>

          <DropdownSection
            title="Best books this year"
            description="Top completed books ranked by rating."
            defaultOpen={false}
          >
            <div className="space-y-2">
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
            </div>
          </DropdownSection>

          <DropdownSection
            title="Goals"
            description="Track monthly/yearly targets with on-track pacing."
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Yearly target (pages)</span>
                  <input
                    type="number"
                    min={0}
                    value={yearlyTargetInput}
                    onChange={(event) => setYearlyTargetInput(Number(event.target.value || 0))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Monthly target (pages)</span>
                  <input
                    type="number"
                    min={0}
                    value={monthlyTargetInput}
                    onChange={(event) => setMonthlyTargetInput(Number(event.target.value || 0))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <p className="text-sm">
                  <span className="font-medium">Year progress:</span> {readingGoals?.yearProgress ?? 0}
                  {readingGoals?.yearlyTarget ? ` / ${readingGoals.yearlyTarget}` : ""}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Year pace:</span>{" "}
                  {readingGoals?.yearPace
                    ? readingGoals.yearPace.isOnTrack
                      ? "On track"
                      : "Behind"
                    : "No target"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Month progress:</span> {readingGoals?.monthProgress ?? 0}
                  {readingGoals?.monthlyTarget ? ` / ${readingGoals.monthlyTarget}` : ""}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Month pace:</span>{" "}
                  {readingGoals?.monthPace
                    ? readingGoals.monthPace.isOnTrack
                      ? "On track"
                      : "Behind"
                    : "No target"}
                </p>
              </div>

              <Button onClick={() => void handleSaveGoals()} disabled={savingGoals}>
                {savingGoals ? "Saving..." : "Save goals"}
              </Button>
            </div>
          </DropdownSection>

          <DropdownSection
            title="Similar recommendations"
            description="Based on authors from books you finished."
            defaultOpen={false}
          >
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4" />
                Recommendation list
              </p>
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Finish more books to unlock recommendations.</p>
              ) : (
                recommendations.map((item) => (
                  <div key={`${item.title}-${item.author}`} className="rounded-md border border-border/70 px-3 py-2 text-sm">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.author}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleRecommendationFeedback({
                            sourceBookId: item.sourceBookId,
                            title: item.title,
                            author: item.author,
                            feedbackType: "already_read",
                          })
                        }
                      >
                        Already read
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void handleRecommendationFeedback({
                            sourceBookId: item.sourceBookId,
                            title: item.title,
                            author: item.author,
                            feedbackType: "not_interested",
                          })
                        }
                      >
                        Not interested
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownSection>
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
              <Card key={status}>
                <CardHeader className="pb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryOpen((current) => ({
                        ...current,
                        [status]: !current[status],
                      }))
                    }
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {status === "to_read" && "📚 To Read"}
                      {status === "reading" && "📖 Currently Reading"}
                      {status === "read" && "✓ Finished"}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({groupedBooks[status].length})
                      </span>
                    </CardTitle>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        categoryOpen[status] ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </button>
                </CardHeader>
                {categoryOpen[status] ? <CardContent>
                  {groupedBooks[status].length === 0 ? (
                    <p className="text-sm text-muted-foreground">No books in this category yet.</p>
                  ) : (
                    <div className="divide-y divide-border rounded-md border border-border/70">
                      {groupedBooks[status].map((book) => {
                        const totalPages = book.totalPages ?? 0
                        const currentPage = Math.max(0, book.currentPage ?? 0)
                        const progressPercent =
                          totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0

                        return (
                          <div key={book.id} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{book.title}</p>
                                <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>
                                    {totalPages > 0
                                      ? `${currentPage} / ${totalPages} pages`
                                      : `${currentPage} pages tracked`}
                                  </span>
                                  <span>{progressPercent}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                  <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2 md:ml-4 md:w-auto">
                              <select
                                value={book.status}
                                onChange={(event) => void handleStatusChange(book.id, event.target.value as BookStatus)}
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              >
                                <option value="to_read">To Read</option>
                                <option value="reading">Reading</option>
                                <option value="read">Finished</option>
                              </select>
                              <Button size="sm" variant="outline" onClick={() => router.push(`/books/${book.id}`)}>
                                Open
                              </Button>
                              <ConfirmDeleteButton
                                size="sm"
                                variant="outline"
                                onConfirmAction={() => handleDeleteBook(book.id)}
                                label="Delete"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent> : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
