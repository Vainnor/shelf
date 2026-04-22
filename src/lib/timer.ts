export const TIMER_STORAGE_KEY = "shelf.timer.session.v1"

export type TimerMode = "stopwatch" | "countdown"
export type PageInputMode = "end_page" | "pages"

export type QuickLogDraft = {
  bookId: string
  elapsedMs: number
  pageMode: PageInputMode
  endPage: string
  pagesRead: string
  notes: string
}

export type PersistedTimerState = {
  mode: TimerMode
  selectedBookId: string
  running: boolean
  startedAtEpochMs: number | null
  accumulatedMs: number
  countdownTotalMs: number
  lastStoppedElapsedMs: number | null
  quickLogDraft: QuickLogDraft | null
}

const DEFAULT_COUNTDOWN_MS = 30 * 60 * 1000

export function createDefaultTimerState(): PersistedTimerState {
  return {
    mode: "stopwatch",
    selectedBookId: "",
    running: false,
    startedAtEpochMs: null,
    accumulatedMs: 0,
    countdownTotalMs: DEFAULT_COUNTDOWN_MS,
    lastStoppedElapsedMs: null,
    quickLogDraft: null,
  }
}

export function deriveElapsedMs(state: Pick<PersistedTimerState, "running" | "startedAtEpochMs" | "accumulatedMs">, nowMs = Date.now()) {
  if (!state.running || state.startedAtEpochMs === null) {
    return Math.max(0, Math.floor(state.accumulatedMs))
  }

  return Math.max(0, Math.floor(state.accumulatedMs + (nowMs - state.startedAtEpochMs)))
}

export function deriveRemainingMs(elapsedMs: number, totalMs: number) {
  return Math.max(0, Math.floor(totalMs - elapsedMs))
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function serializeTimerState(state: PersistedTimerState) {
  return JSON.stringify(state)
}

export function deserializeTimerState(raw: string): PersistedTimerState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedTimerState>
    if (!parsed || typeof parsed !== "object") {
      return null
    }

    const mode = parsed.mode === "countdown" ? "countdown" : parsed.mode === "stopwatch" ? "stopwatch" : null
    if (!mode) {
      return null
    }

    const running = Boolean(parsed.running)
    const selectedBookId = typeof parsed.selectedBookId === "string" ? parsed.selectedBookId : ""
    const startedAtEpochMs =
      typeof parsed.startedAtEpochMs === "number" && Number.isFinite(parsed.startedAtEpochMs)
        ? parsed.startedAtEpochMs
        : null
    const accumulatedMs = typeof parsed.accumulatedMs === "number" && Number.isFinite(parsed.accumulatedMs)
      ? Math.max(0, parsed.accumulatedMs)
      : 0
    const countdownTotalMs =
      typeof parsed.countdownTotalMs === "number" && Number.isFinite(parsed.countdownTotalMs)
        ? Math.max(1000, parsed.countdownTotalMs)
        : DEFAULT_COUNTDOWN_MS
    const lastStoppedElapsedMs =
      typeof parsed.lastStoppedElapsedMs === "number" && Number.isFinite(parsed.lastStoppedElapsedMs)
        ? Math.max(0, parsed.lastStoppedElapsedMs)
        : null

    let quickLogDraft: QuickLogDraft | null = null
    if (parsed.quickLogDraft && typeof parsed.quickLogDraft === "object") {
      const draft = parsed.quickLogDraft as Partial<QuickLogDraft>
      const pageMode = draft.pageMode === "pages" ? "pages" : "end_page"
      const bookId = typeof draft.bookId === "string" ? draft.bookId : ""
      const elapsedMs = typeof draft.elapsedMs === "number" && Number.isFinite(draft.elapsedMs) ? Math.max(0, draft.elapsedMs) : 0
      quickLogDraft = {
        bookId,
        elapsedMs,
        pageMode,
        endPage: typeof draft.endPage === "string" ? draft.endPage : "",
        pagesRead: typeof draft.pagesRead === "string" ? draft.pagesRead : "",
        notes: typeof draft.notes === "string" ? draft.notes : "",
      }

      if (!quickLogDraft.bookId || quickLogDraft.elapsedMs <= 0) {
        quickLogDraft = null
      }
    }

    const effectiveRunning = running && startedAtEpochMs !== null

    return {
      mode,
      selectedBookId,
      running: effectiveRunning,
      startedAtEpochMs: effectiveRunning ? startedAtEpochMs : null,
      accumulatedMs,
      countdownTotalMs,
      lastStoppedElapsedMs,
      quickLogDraft,
    }
  } catch {
    return null
  }
}
