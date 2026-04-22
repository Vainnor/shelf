"use client"

import { AlarmClock, BookCheck, BookOpen, ChevronDown, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { getSession } from "@/src/actions/auth"
import {
  changeBookStatus,
  getBestBooksThisYear,
  getBookRecommendations,
  getBooks,
  getReadingGoalsV2,
  getWeeklyInsights,
  submitRecommendationFeedback,
  updateReadingGoalsV2,
} from "@/src/actions/books"
import ProfileMenu from "@/src/components/auth/profile-menu"
import PageHeader from "@/src/components/layout/page-header"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Badge } from "@/src/components/ui/badge"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { booksTable } from "@/src/db/schema/book"
import type { UserRole } from "@/src/db/schema/user"
import type { BookStatus } from "@/src/lib/books"
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

type DashboardPanelState = {
  toReadPreviewOpen: boolean
  readPreviewOpen: boolean
  weeklyInsightsOpen: boolean
  bestBooksOpen: boolean
  recommendationsOpen: boolean
  goalsOpen: boolean
}

type CollapsiblePanelProps = {
  title: string
  description: string
  open: boolean
  count?: number
  onToggle: () => void
  actions?: ReactNode
  children: ReactNode
}

const DEFAULT_PANEL_STATE: DashboardPanelState = {
  toReadPreviewOpen: false,
  readPreviewOpen: false,
  weeklyInsightsOpen: false,
  bestBooksOpen: false,
  recommendationsOpen: false,
  goalsOpen: false,
}

const PREVIEW_LIMIT = 5

// Keep the key namespaced to avoid collisions with other pages.
const DASHBOARD_PANEL_STORAGE_KEY = "shelf.dashboard.panel-state.v1"

function sortByUpdatedAt(books: Book[]) {
  return [...books].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function toSafeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

function progressPercent(book: Book) {
  const totalPages = book.totalPages ?? 0
  const currentPage = Math.max(0, book.currentPage ?? 0)
  if (totalPages <= 0) {
    return 0
  }

  return Math.min(100, Math.round((currentPage / totalPages) * 100))
}

function CollapsiblePanel({ title, description, open, count, onToggle, actions, children }: CollapsiblePanelProps) {
  return (
    <Card size="sm" className="relative overflow-hidden border border-border/70 bg-card/90 shadow-xs">
      <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.1)_1px,transparent_1px)]" />
      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{title}</CardTitle>
              {typeof count === "number" ? <Badge variant="secondary">{count}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onToggle}
              aria-expanded={open}
              aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
            >
              <ChevronDown className={cn("size-4 transition-transform", open ? "rotate-180" : "rotate-0")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {open ? <CardContent className="relative z-10 pt-0">{children}</CardContent> : null}
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  const [session, setSession] = useState<Session>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsights>(null)
  const [bestBooks, setBestBooks] = useState<Book[]>([])
  const [recommendations, setRecommendations] = useState<BookRecommendations>([])
  const [readingGoals, setReadingGoals] = useState<ReadingGoalsV2>(null)
  const [yearlyTargetInput, setYearlyTargetInput] = useState(0)
  const [monthlyTargetInput, setMonthlyTargetInput] = useState(0)
  const [savingGoals, setSavingGoals] = useState(false)

  const [panelState, setPanelState] = useState<DashboardPanelState>(DEFAULT_PANEL_STATE)
  const [panelStateHydrated, setPanelStateHydrated] = useState(false)

  const displayName = session?.user?.name ?? session?.user?.email ?? "Guest"

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSession()
        if (!sessionData) {
          router.push("/login")
          return
        }

        setSession(sessionData)
      } catch (sessionError) {
        console.error("Error fetching session:", sessionError)
        router.push("/login")
      }
    }

    void fetchSession()
  }, [router])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DASHBOARD_PANEL_STORAGE_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as Partial<DashboardPanelState>
      setPanelState({
        toReadPreviewOpen: toSafeBoolean(parsed.toReadPreviewOpen, DEFAULT_PANEL_STATE.toReadPreviewOpen),
        readPreviewOpen: toSafeBoolean(parsed.readPreviewOpen, DEFAULT_PANEL_STATE.readPreviewOpen),
        weeklyInsightsOpen: toSafeBoolean(parsed.weeklyInsightsOpen, DEFAULT_PANEL_STATE.weeklyInsightsOpen),
        bestBooksOpen: toSafeBoolean(parsed.bestBooksOpen, DEFAULT_PANEL_STATE.bestBooksOpen),
        recommendationsOpen: toSafeBoolean(parsed.recommendationsOpen, DEFAULT_PANEL_STATE.recommendationsOpen),
        goalsOpen: toSafeBoolean(parsed.goalsOpen, DEFAULT_PANEL_STATE.goalsOpen),
      })
    } catch (storageError) {
      console.error("Error restoring dashboard panel state:", storageError)
    } finally {
      setPanelStateHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!panelStateHydrated) {
      return
    }

    try {
      window.localStorage.setItem(DASHBOARD_PANEL_STORAGE_KEY, JSON.stringify(panelState))
    } catch (storageError) {
      console.error("Error storing dashboard panel state:", storageError)
    }
  }, [panelState, panelStateHydrated])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getBooks()
      setBooks(data)
    } catch (booksError) {
      console.error("Error fetching books:", booksError)
      setError("Failed to load books")
    } finally {
      setLoading(false)
    }
  }, [])

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
    } catch (insightsError) {
      console.error("Error fetching dashboard insights:", insightsError)
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      return
    }

    void Promise.all([fetchBooks(), fetchDashboardInsights()])
  }, [fetchBooks, fetchDashboardInsights, session])

  const groupedBooks = useMemo(() => {
    const byUpdatedAt = sortByUpdatedAt(books)
    return {
      reading: byUpdatedAt.filter((book) => book.status === "reading"),
      to_read: byUpdatedAt.filter((book) => book.status === "to_read"),
      read: byUpdatedAt.filter((book) => book.status === "read"),
    }
  }, [books])

  const togglePanel = (key: keyof DashboardPanelState) => {
    setPanelState((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const handleAddBookClick = () => {
    router.push("/books/new")
  }

  const handleStatusChange = async (bookId: string, newStatus: BookStatus) => {
    try {
      await changeBookStatus(bookId, newStatus)
      await Promise.all([fetchBooks(), fetchDashboardInsights()])
    } catch (statusError) {
      console.error("Error updating status:", statusError)
      setError("Failed to update status")
      toast.error("Failed to update status")
    }
  }

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
    } catch (goalsError) {
      console.error("Error updating goals:", goalsError)
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
    } catch (feedbackError) {
      console.error("Error saving recommendation feedback:", feedbackError)
      toast.error("Failed to save recommendation feedback")
      const refreshed = await getBookRecommendations(6)
      setRecommendations(refreshed)
    }
  }

  const readingBooks = groupedBooks.reading
  const toReadBooksPreview = groupedBooks.to_read.slice(0, PREVIEW_LIMIT)
  const readBooksPreview = groupedBooks.read.slice(0, PREVIEW_LIMIT)

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-background p-6 lg:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-45 bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-background/85 to-muted/10" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-b from-background to-muted/20 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-45 bg-[radial-gradient(circle,rgba(148,163,184,0.24)_1px,transparent_1px)] bg-size-[18px_18px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-sky-500/5" />

          <div className="relative z-10">
            <PageHeader
              title={`Welcome back, ${displayName}`}
              description="Focus on what you are reading now, with the rest close by when needed."
              breadcrumbCurrentLabel="Dashboard"
              actions={(
                <>
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
                </>
              )}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="border border-border/70 bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="size-5 text-primary" />
                      Currently Reading
                      <Badge variant="secondary">{readingBooks.length}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Most recently active books with timer-first reading actions.</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading books...</p>
                ) : readingBooks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-5">
                    <p className="text-sm text-muted-foreground">No books are currently in progress.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={handleAddBookClick}>Add a book</Button>
                      <Link href="/board" className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Open board
                      </Link>
                    </div>
                  </div>
                ) : (
                  readingBooks.map((book) => {
                    const totalPages = book.totalPages ?? 0
                    const currentPage = Math.max(0, book.currentPage ?? 0)
                    const percent = progressPercent(book)

                    return (
                      <div key={book.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1 space-y-2">
                            <button className="block text-left hover:underline" onClick={() => router.push(`/books/${book.id}`)}>
                              <p className="truncate text-sm font-semibold">{book.title}</p>
                            </button>
                            <p className="truncate text-xs text-muted-foreground">{book.author}</p>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {totalPages > 0 ? `${currentPage} / ${totalPages} pages` : `${currentPage} pages tracked`}
                                </span>
                                <span>{percent}%</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <Button size="sm" variant="outline" onClick={() => router.push(`/books/${book.id}`)}>
                              Open
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => router.push("/timer")}>Timer</Button>
                            <select
                              value={book.status}
                              onChange={(event) => void handleStatusChange(book.id, event.target.value as BookStatus)}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              <option value="to_read">To Read</option>
                              <option value="reading">Reading</option>
                              <option value="read">Finished</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <CollapsiblePanel
              title="Next To Read"
              description="Keep your upcoming reads tucked away but one click away."
              count={groupedBooks.to_read.length}
              open={panelState.toReadPreviewOpen}
              onToggle={() => togglePanel("toReadPreviewOpen")}
              actions={
                <Link href="/board" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Open board
                </Link>
              }
            >
              {toReadBooksPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No books queued yet.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {toReadBooksPreview.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-left hover:bg-muted/25"
                      onClick={() => router.push(`/books/${book.id}`)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{book.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{book.author}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{Math.max(0, book.currentPage ?? 0)}p</span>
                    </button>
                  ))}
                </div>
              )}
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Finished"
              description="Recent completed books stay available without taking over the page."
              count={groupedBooks.read.length}
              open={panelState.readPreviewOpen}
              onToggle={() => togglePanel("readPreviewOpen")}
              actions={
                <Link href="/library" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Open library
                </Link>
              }
            >
              {readBooksPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No finished books yet.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {readBooksPreview.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-border/70 bg-background/70 px-3 py-2 text-left hover:bg-muted/25"
                      onClick={() => router.push(`/books/${book.id}`)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{book.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{book.author}</span>
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">{book.rating ?? "-"}/5</span>
                    </button>
                  ))}
                </div>
              )}
            </CollapsiblePanel>
          </div>

          <aside className="space-y-4">
            <CollapsiblePanel
              title="Weekly Insights"
              description="Reading momentum over the last 7 days."
              open={panelState.weeklyInsightsOpen}
              onToggle={() => togglePanel("weeklyInsightsOpen")}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="text-sm"><span className="font-medium">Sessions:</span> {weeklyInsights?.sessionsCount ?? 0}</p>
                <p className="text-sm"><span className="font-medium">Pages:</span> {weeklyInsights?.pagesRead ?? 0}</p>
                <p className="text-sm"><span className="font-medium">Minutes:</span> {weeklyInsights?.minutesRead ?? 0}</p>
                <p className="text-sm"><span className="font-medium">Streak:</span> {weeklyInsights?.currentStreak ?? 0} day(s)</p>
                <p className="text-sm"><span className="font-medium">Active days:</span> {weeklyInsights?.activeDays ?? 0}</p>
                <p className="text-sm"><span className="font-medium">Daily goal:</span> {weeklyInsights?.dailyPageGoal ?? 0} pages</p>
              </div>
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Best Books This Year"
              description="Top completed books ranked by rating."
              open={panelState.bestBooksOpen}
              onToggle={() => togglePanel("bestBooksOpen")}
            >
              <div className="space-y-2">
                {bestBooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completed rated books yet.</p>
                ) : (
                  bestBooks.map((book) => (
                    <div key={book.id} className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2 text-sm">
                      <button className="min-w-0 text-left hover:underline" onClick={() => router.push(`/books/${book.id}`)}>
                        <span className="block truncate">{book.title}</span>
                      </button>
                      <span className="font-medium">{book.rating ?? "-"}/5</span>
                    </div>
                  ))
                )}
              </div>
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Recommendations"
              description="Suggestions based on authors from completed books."
              open={panelState.recommendationsOpen}
              count={recommendations.length}
              onToggle={() => togglePanel("recommendationsOpen")}
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
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Goals"
              description="Monthly and yearly targets with pace tracking."
              open={panelState.goalsOpen}
              onToggle={() => togglePanel("goalsOpen")}
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

                <div className="space-y-2 rounded-md border border-border/70 bg-background/70 p-3 text-sm">
                  <p>
                    <span className="font-medium">Year progress:</span> {readingGoals?.yearProgress ?? 0}
                    {readingGoals?.yearlyTarget ? ` / ${readingGoals.yearlyTarget}` : ""}
                  </p>
                  <p>
                    <span className="font-medium">Year pace:</span>{" "}
                    {readingGoals?.yearPace
                      ? readingGoals.yearPace.isOnTrack
                        ? "On track"
                        : "Behind"
                      : "No target"}
                  </p>
                  <p>
                    <span className="font-medium">Month progress:</span> {readingGoals?.monthProgress ?? 0}
                    {readingGoals?.monthlyTarget ? ` / ${readingGoals.monthlyTarget}` : ""}
                  </p>
                  <p>
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
            </CollapsiblePanel>

            <Card size="sm" className="border border-border/70 bg-card/90 shadow-xs">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookCheck className="size-4" />
                  Total books: <span className="font-medium text-foreground">{books.length}</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  )
}
