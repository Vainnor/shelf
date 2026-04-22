"use client"

import { AlarmClock, ArrowLeft, BookOpenText, Clock3, Pause, Play, RotateCcw, StopCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { getSession } from "@/src/actions/auth"
import { getBooks, logBookReadingSession } from "@/src/actions/books"
import ProfileMenu from "@/src/components/auth/profile-menu"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Badge } from "@/src/components/ui/badge"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import type { booksTable } from "@/src/db/schema/book"
import type { UserRole } from "@/src/db/schema/user"
import {
  TIMER_STORAGE_KEY,
  createDefaultTimerState,
  deserializeTimerState,
  deriveElapsedMs,
  deriveRemainingMs,
  formatDuration,
  serializeTimerState,
  type PersistedTimerState,
  type TimerMode,
} from "@/src/lib/timer"
import { cn } from "@/src/lib/utils"

const TICK_INTERVAL_MS = 250
const COUNTDOWN_PRESETS_MINUTES = [15, 30, 45, 60] as const

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

function sortBooksForTimer(books: Book[]) {
  const statusOrder: Record<Book["status"], number> = {
    reading: 0,
    to_read: 1,
    read: 2,
  }

  return [...books].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff

    const updatedDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    if (updatedDiff !== 0) return updatedDiff

    return a.title.localeCompare(b.title)
  })
}

function toCountdownFields(totalMs: number) {
  const totalMinutes = Math.max(1, Math.round(totalMs / (60 * 1000)))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return {
    hours: String(hours),
    minutes: String(minutes),
  }
}

function toRoundedSessionMinutes(elapsedMs: number) {
  return Math.max(1, Math.round(elapsedMs / (60 * 1000)))
}

export default function ReadingTimerWorkspace() {
  const router = useRouter()

  const [session, setSession] = useState<Session>(null)
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [bookSearch, setBookSearch] = useState("")
  const [hydrated, setHydrated] = useState(false)
  const [nowMs, setNowMs] = useState(Date.now())
  const [timerState, setTimerState] = useState<PersistedTimerState>(createDefaultTimerState)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [countdownHoursInput, setCountdownHoursInput] = useState("0")
  const [countdownMinutesInput, setCountdownMinutesInput] = useState("30")
  const autoStoppedRef = useRef(false)

  const refreshBooks = useCallback(async () => {
    const allBooks = await getBooks()
    const sorted = sortBooksForTimer(allBooks)
    setBooks(sorted)
    return sorted
  }, [])

  useEffect(() => {
    const boot = async () => {
      try {
        const sessionData = await getSession()
        if (!sessionData) {
          router.push("/login")
          return
        }

        setSession(sessionData)
        await refreshBooks()
      } catch (error) {
        console.error("Error booting timer workspace:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    void boot()
  }, [refreshBooks, router])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TIMER_STORAGE_KEY)
      if (raw) {
        const parsed = deserializeTimerState(raw)
        if (parsed) {
          setTimerState(parsed)
          const fields = toCountdownFields(parsed.countdownTotalMs)
          setCountdownHoursInput(fields.hours)
          setCountdownMinutesInput(fields.minutes)
          setQuickLogOpen(Boolean(parsed.quickLogDraft))
        }
      }
    } catch {
      // Ignore localStorage access failures.
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    try {
      window.localStorage.setItem(TIMER_STORAGE_KEY, serializeTimerState(timerState))
    } catch {
      // Ignore localStorage access failures.
    }
  }, [hydrated, timerState])

  useEffect(() => {
    if (!timerState.running) {
      return
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, TICK_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [timerState.running])

  useEffect(() => {
    if (!timerState.running) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [timerState.running])

  const selectedBook = useMemo(
    () => books.find((book) => book.id === timerState.selectedBookId) ?? null,
    [books, timerState.selectedBookId]
  )

  const quickLogBook = useMemo(
    () => books.find((book) => book.id === timerState.quickLogDraft?.bookId) ?? null,
    [books, timerState.quickLogDraft?.bookId]
  )

  const filteredBooks = useMemo(() => {
    const query = bookSearch.trim().toLowerCase()
    if (!query) {
      return books
    }

    return books.filter((book) => {
      const candidate = `${book.title} ${book.author} ${book.isbn ?? ""}`.toLowerCase()
      return candidate.includes(query)
    })
  }, [bookSearch, books])

  const sessionInProgress = timerState.running || timerState.accumulatedMs > 0
  const elapsedMs = deriveElapsedMs(timerState, nowMs)
  const countdownRemainingMs = deriveRemainingMs(elapsedMs, timerState.countdownTotalMs)
  const isCountdown = timerState.mode === "countdown"

  const heroDisplayMs = useMemo(() => {
    if (timerState.mode === "countdown") {
      if (sessionInProgress) {
        return countdownRemainingMs
      }
      return timerState.countdownTotalMs
    }

    return elapsedMs
  }, [countdownRemainingMs, elapsedMs, sessionInProgress, timerState.countdownTotalMs, timerState.mode])

  const countdownProgress = useMemo(() => {
    if (!isCountdown || timerState.countdownTotalMs <= 0) {
      return 0
    }

    const ratio = elapsedMs / timerState.countdownTotalMs
    return Math.max(0, Math.min(1, ratio))
  }, [elapsedMs, isCountdown, timerState.countdownTotalMs])

  const statusLabel = useMemo(() => {
    if (timerState.running) {
      return timerState.mode === "countdown" ? "Countdown running" : "Stopwatch running"
    }

    if (timerState.accumulatedMs > 0) {
      return "Paused"
    }

    return "Idle"
  }, [timerState.accumulatedMs, timerState.mode, timerState.running])

  const modeLocked = sessionInProgress
  const bookLocked = sessionInProgress
  const canAdjustCountdown = !sessionInProgress

  const stopAndPrepareQuickLog = useCallback(
    (reason: "manual" | "finished") => {
      if (!timerState.selectedBookId) {
        toast.error("Select a book first")
        return
      }

      const snapshotNow = Date.now()
      const rawElapsedMs = deriveElapsedMs(timerState, snapshotNow)
      const elapsedForLog = timerState.mode === "countdown"
        ? Math.min(rawElapsedMs, timerState.countdownTotalMs)
        : rawElapsedMs

      if (elapsedForLog <= 0) {
        toast.error("No session time recorded yet")
        return
      }

      setTimerState((prev) => ({
        ...prev,
        running: false,
        startedAtEpochMs: null,
        accumulatedMs: 0,
        lastStoppedElapsedMs: elapsedForLog,
        quickLogDraft: {
          bookId: prev.selectedBookId,
          elapsedMs: elapsedForLog,
          pageMode: "end_page",
          endPage: "",
          pagesRead: "",
          notes: "",
        },
      }))

      setNowMs(snapshotNow)
      setQuickLogOpen(true)

      if (reason === "finished") {
        toast.success("Countdown complete. Ready to log your session.")
      }
    },
    [timerState]
  )

  useEffect(() => {
    if (!timerState.running || timerState.mode !== "countdown") {
      autoStoppedRef.current = false
      return
    }

    if (countdownRemainingMs > 0) {
      autoStoppedRef.current = false
      return
    }

    if (autoStoppedRef.current) {
      return
    }

    autoStoppedRef.current = true
    stopAndPrepareQuickLog("finished")
  }, [countdownRemainingMs, stopAndPrepareQuickLog, timerState.mode, timerState.running])

  const handleSelectMode = (mode: TimerMode) => {
    if (modeLocked) {
      return
    }

    setTimerState((prev) => ({
      ...prev,
      mode,
    }))
  }

  const handleStart = () => {
    if (!timerState.selectedBookId) {
      toast.error("Select a book before starting")
      return
    }

    if (timerState.mode === "countdown" && timerState.countdownTotalMs <= 0) {
      toast.error("Set a valid countdown duration")
      return
    }

    const now = Date.now()

    setTimerState((prev) => {
      const shouldResetCountdown = prev.mode === "countdown" && prev.accumulatedMs >= prev.countdownTotalMs
      return {
        ...prev,
        running: true,
        startedAtEpochMs: now,
        accumulatedMs: shouldResetCountdown ? 0 : prev.accumulatedMs,
      }
    })

    setNowMs(now)
  }

  const handlePause = () => {
    if (!timerState.running) {
      return
    }

    const now = Date.now()
    const pausedElapsed = deriveElapsedMs(timerState, now)
    const clampedElapsed = timerState.mode === "countdown"
      ? Math.min(pausedElapsed, timerState.countdownTotalMs)
      : pausedElapsed

    setTimerState((prev) => ({
      ...prev,
      running: false,
      startedAtEpochMs: null,
      accumulatedMs: clampedElapsed,
    }))

    setNowMs(now)
  }

  const handleStop = () => {
    stopAndPrepareQuickLog("manual")
  }

  const handleReset = () => {
    setTimerState((prev) => ({
      ...prev,
      running: false,
      startedAtEpochMs: null,
      accumulatedMs: 0,
      lastStoppedElapsedMs: null,
    }))

    setNowMs(Date.now())
  }

  const applyCountdownTotalMs = (totalMs: number) => {
    const nextTotalMs = Math.max(60 * 1000, Math.floor(totalMs))
    const fields = toCountdownFields(nextTotalMs)
    setCountdownHoursInput(fields.hours)
    setCountdownMinutesInput(fields.minutes)

    setTimerState((prev) => ({
      ...prev,
      countdownTotalMs: nextTotalMs,
      accumulatedMs: 0,
      startedAtEpochMs: null,
      running: false,
    }))
  }

  const handleApplyCustomCountdown = () => {
    if (!canAdjustCountdown) {
      return
    }

    const hours = Math.max(0, Math.floor(Number(countdownHoursInput || "0")))
    const minutes = Math.max(0, Math.floor(Number(countdownMinutesInput || "0")))
    const totalMinutes = hours * 60 + minutes

    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
      toast.error("Enter a countdown greater than zero")
      return
    }

    applyCountdownTotalMs(totalMinutes * 60 * 1000)
  }

  const handleSaveQuickLog = async () => {
    const draft = timerState.quickLogDraft
    if (!draft) {
      toast.error("No session available to log")
      return
    }

    if (!draft.bookId) {
      toast.error("Select a book before logging")
      return
    }

    if (draft.pageMode === "end_page" && !draft.endPage.trim()) {
      toast.error("Enter the page you ended on")
      return
    }

    if (draft.pageMode === "pages" && !draft.pagesRead.trim()) {
      toast.error("Enter total pages read")
      return
    }

    setIsSavingLog(true)

    try {
      await logBookReadingSession({
        bookId: draft.bookId,
        timeMode: "duration",
        durationMinutes: toRoundedSessionMinutes(draft.elapsedMs),
        pageMode: draft.pageMode,
        endPage: draft.pageMode === "end_page" ? Number(draft.endPage.trim()) : undefined,
        pagesRead: draft.pageMode === "pages" ? Number(draft.pagesRead.trim()) : undefined,
        notes: draft.notes.trim() ? draft.notes.trim() : null,
      })

      await refreshBooks()

      setTimerState((prev) => ({
        ...prev,
        quickLogDraft: null,
        lastStoppedElapsedMs: null,
      }))
      setQuickLogOpen(false)
      toast.success("Reading session logged")
    } catch (error) {
      console.error("Error logging timed session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to log session")
    } finally {
      setIsSavingLog(false)
    }
  }

  const displayName = session?.user?.name ?? session?.user?.email ?? "Reader"

  if (loading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-7xl">
          <p className="text-center text-sm text-muted-foreground">Loading timer workspace...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <AlarmClock className="size-3.5" />
              Timer
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Reading Timer</h1>
            <p className="text-muted-foreground">
              Track focused reading sessions for {displayName} and log progress in one flow.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "default" })}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
            <NotificationsButton />
            <ProfileMenu
              name={session?.user?.name ?? ""}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-80 max-w-5xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 blur-3xl" />

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-4 top-4 h-28 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15 blur-2xl" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="size-4" />
                Session Controls
              </CardTitle>
              <CardDescription>Choose a mode, start your session, and stop to quick-log progress.</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={timerState.mode === "stopwatch" ? "default" : "outline"}
                  onClick={() => handleSelectMode("stopwatch")}
                  disabled={modeLocked}
                >
                  Stopwatch
                </Button>
                <Button
                  type="button"
                  variant={timerState.mode === "countdown" ? "default" : "outline"}
                  onClick={() => handleSelectMode("countdown")}
                  disabled={modeLocked}
                >
                  Countdown
                </Button>
              </div>

              <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                <label htmlFor="timer-book-search" className="text-sm font-medium">
                  Select book
                </label>
                <Input
                  id="timer-book-search"
                  value={bookSearch}
                  onChange={(event) => setBookSearch(event.target.value)}
                  placeholder="Search title, author, or ISBN"
                  disabled={bookLocked}
                />
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border/70 bg-background p-1">
                  {filteredBooks.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-muted-foreground">No books match your search.</p>
                  ) : (
                    filteredBooks.map((book) => {
                      const selected = book.id === timerState.selectedBookId
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => setTimerState((prev) => ({ ...prev, selectedBookId: book.id }))}
                          disabled={bookLocked}
                          className={cn(
                            "w-full rounded-md border px-2 py-2 text-left text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-transparent hover:border-border hover:bg-muted/60"
                          )}
                        >
                          <p className="font-medium">{book.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {book.author} · {book.currentPage}/{book.totalPages ?? "?"} pages · {book.status.replace("_", " ")}
                          </p>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {timerState.mode === "countdown" ? (
                <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="text-sm font-medium">Countdown setup</p>
                  <div className="flex flex-wrap gap-2">
                    {COUNTDOWN_PRESETS_MINUTES.map((minutes) => (
                      <Button
                        key={minutes}
                        type="button"
                        size="sm"
                        variant={timerState.countdownTotalMs === minutes * 60 * 1000 ? "default" : "outline"}
                        onClick={() => applyCountdownTotalMs(minutes * 60 * 1000)}
                        disabled={!canAdjustCountdown}
                      >
                        {minutes}m
                      </Button>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      type="number"
                      min={0}
                      value={countdownHoursInput}
                      onChange={(event) => setCountdownHoursInput(event.target.value)}
                      placeholder="Hours"
                      disabled={!canAdjustCountdown}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={countdownMinutesInput}
                      onChange={(event) => setCountdownMinutesInput(event.target.value)}
                      placeholder="Minutes"
                      disabled={!canAdjustCountdown}
                    />
                    <Button type="button" variant="outline" onClick={handleApplyCustomCountdown} disabled={!canAdjustCountdown}>
                      Apply
                    </Button>
                  </div>
                </div>
              ) : null}

              <div
                aria-live="polite"
                className="rounded-xl border border-border bg-card px-5 py-6 text-center shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{statusLabel}</p>
                <p className="mt-2 font-mono text-5xl font-semibold tracking-tight sm:text-6xl">{formatDuration(heroDisplayMs)}</p>
                {selectedBook ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Active book: <span className="font-medium text-foreground">{selectedBook.title}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Select a book to begin timing.</p>
                )}
              </div>

              {timerState.mode === "countdown" ? (
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${Math.round(countdownProgress * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(countdownProgress * 100)}% complete
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {!timerState.running && timerState.accumulatedMs <= 0 ? (
                  <Button onClick={handleStart} className="gap-2">
                    <Play className="size-4" />
                    Start
                  </Button>
                ) : null}

                {timerState.running ? (
                  <>
                    <Button variant="outline" onClick={handlePause} className="gap-2">
                      <Pause className="size-4" />
                      Pause
                    </Button>
                    <Button variant="outline" onClick={handleStop} className="gap-2">
                      <StopCircle className="size-4" />
                      Stop + Log
                    </Button>
                  </>
                ) : null}

                {!timerState.running && timerState.accumulatedMs > 0 ? (
                  <>
                    <Button onClick={handleStart} className="gap-2">
                      <Play className="size-4" />
                      Resume
                    </Button>
                    <Button variant="outline" onClick={handleStop} className="gap-2">
                      <StopCircle className="size-4" />
                      Stop + Log
                    </Button>
                    <Button variant="outline" onClick={handleReset} className="gap-2">
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  </>
                ) : null}
              </div>

              {timerState.lastStoppedElapsedMs && !timerState.quickLogDraft ? (
                <p className="text-xs text-muted-foreground">
                  Last session: {formatDuration(timerState.lastStoppedElapsedMs)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpenText className="size-4" />
                Quick Log
              </CardTitle>
              <CardDescription>
                Save the timed session with your latest reading progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {timerState.quickLogDraft && !quickLogOpen ? (
                <Button variant="outline" onClick={() => setQuickLogOpen(true)}>
                  Log last session
                </Button>
              ) : null}

              {!timerState.quickLogDraft ? (
                <p className="rounded-md border border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  Stop a stopwatch or countdown session to open the quick-log form.
                </p>
              ) : null}

              {timerState.quickLogDraft && quickLogOpen ? (
                <div className="space-y-3 rounded-md border border-border/70 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Book</p>
                    <p className="text-sm text-muted-foreground">
                      {quickLogBook ? `${quickLogBook.title} by ${quickLogBook.author}` : "Selected book no longer exists"}
                    </p>
                  </div>

                  <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Session time</p>
                    <p className="font-mono text-xl font-semibold">{formatDuration(timerState.quickLogDraft.elapsedMs)}</p>
                    <p className="text-xs text-muted-foreground">
                      Logged as {toRoundedSessionMinutes(timerState.quickLogDraft.elapsedMs)} minute(s)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pages</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={timerState.quickLogDraft.pageMode === "end_page" ? "default" : "outline"}
                        onClick={() =>
                          setTimerState((prev) => {
                            if (!prev.quickLogDraft) return prev
                            return {
                              ...prev,
                              quickLogDraft: {
                                ...prev.quickLogDraft,
                                pageMode: "end_page",
                              },
                            }
                          })
                        }
                      >
                        End page
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={timerState.quickLogDraft.pageMode === "pages" ? "default" : "outline"}
                        onClick={() =>
                          setTimerState((prev) => {
                            if (!prev.quickLogDraft) return prev
                            return {
                              ...prev,
                              quickLogDraft: {
                                ...prev.quickLogDraft,
                                pageMode: "pages",
                              },
                            }
                          })
                        }
                      >
                        Pages read
                      </Button>
                    </div>

                    {timerState.quickLogDraft.pageMode === "end_page" ? (
                      <Input
                        type="number"
                        min={0}
                        value={timerState.quickLogDraft.endPage}
                        onChange={(event) =>
                          setTimerState((prev) => {
                            if (!prev.quickLogDraft) return prev
                            return {
                              ...prev,
                              quickLogDraft: {
                                ...prev.quickLogDraft,
                                endPage: event.target.value,
                              },
                            }
                          })
                        }
                        placeholder={`Ended on page (currently ${quickLogBook?.currentPage ?? 0})`}
                      />
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        value={timerState.quickLogDraft.pagesRead}
                        onChange={(event) =>
                          setTimerState((prev) => {
                            if (!prev.quickLogDraft) return prev
                            return {
                              ...prev,
                              quickLogDraft: {
                                ...prev.quickLogDraft,
                                pagesRead: event.target.value,
                              },
                            }
                          })
                        }
                        placeholder="Total pages read"
                      />
                    )}
                  </div>

                  <textarea
                    value={timerState.quickLogDraft.notes}
                    onChange={(event) =>
                      setTimerState((prev) => {
                        if (!prev.quickLogDraft) return prev
                        return {
                          ...prev,
                          quickLogDraft: {
                            ...prev.quickLogDraft,
                            notes: event.target.value,
                          },
                        }
                      })
                    }
                    placeholder="Optional notes"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSaveQuickLog} disabled={isSavingLog || !quickLogBook}>
                      {isSavingLog ? "Saving..." : "Save session"}
                    </Button>
                    <Button variant="outline" onClick={() => setQuickLogOpen(false)} disabled={isSavingLog}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
