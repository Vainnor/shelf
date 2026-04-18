"use client"

import { BookOpen } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/src/components/ui/badge"
import type { BookStatus } from "@/src/lib/books"

const statusColors: Record<BookStatus, string> = {
  to_read: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  reading: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  read: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

const statusLabels: Record<BookStatus, string> = {
  to_read: "To Read",
  reading: "Reading",
  read: "Finished",
}

type BookVisualSummaryProps = {
  title: string
  author: string
  status: BookStatus
  currentPage: number
  totalPages?: number | null
  coverUrl?: string | null
  isbn?: string | null
  isFavorite?: boolean
  variant?: "compact" | "hero"
  children?: ReactNode
}

function toSafePage(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

export function BookVisualSummary({
  title,
  author,
  status,
  currentPage,
  totalPages,
  coverUrl,
  isbn,
  isFavorite = false,
  variant = "compact",
  children,
}: BookVisualSummaryProps) {
  const hasPages = typeof totalPages === "number" && totalPages > 0
  const safeTotalPages = hasPages ? Math.max(1, Math.floor(totalPages)) : 0
  const safeCurrentPage = hasPages ? Math.min(toSafePage(currentPage), safeTotalPages) : toSafePage(currentPage)
  const progressPercent = hasPages ? Math.min(100, Math.round((safeCurrentPage / safeTotalPages) * 100)) : 0

  const isHero = variant === "hero"

  return (
    <div className={isHero ? "flex items-start gap-4" : "space-y-3"}>
      <div
        className={
          isHero
            ? "relative w-[140px] shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted/30 aspect-2/3 sm:w-[180px]"
            : "relative mx-auto w-full max-w-28 overflow-hidden rounded-md border border-border/70 bg-muted/30 aspect-2/3 sm:max-w-32 lg:max-w-36"
        }
      >
        {coverUrl?.trim() ? (
          <img src={coverUrl} alt={`${title} cover`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className={isHero ? "size-10 text-muted-foreground" : "size-8 text-muted-foreground"} />
          </div>
        )}
      </div>

      <div className={isHero ? "min-w-0 flex-1 space-y-3" : "space-y-1.5"}>
        <div className={isHero ? "space-y-2" : "space-y-1.5"}>
          <h2 className={isHero ? "line-clamp-2 text-3xl font-semibold tracking-tight" : "line-clamp-2 text-base font-semibold tracking-tight"}>
            {title}
          </h2>
          <p className={isHero ? "line-clamp-2 text-base text-muted-foreground" : "line-clamp-1 text-sm text-muted-foreground"}>
            {author}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
            {isbn?.trim() ? <Badge variant="outline">ISBN: {isbn.trim()}</Badge> : null}
            {isFavorite ? <Badge variant="outline">Favorite</Badge> : null}
          </div>
        </div>

        <div className={isHero ? "space-y-2 rounded-md border border-border/70 p-3" : "space-y-1.5 rounded-md border border-border/70 p-2.5"}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {hasPages ? `${safeCurrentPage} / ${safeTotalPages} pages` : `${safeCurrentPage} pages tracked`}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {children ? <div className={isHero ? "pt-1" : "pt-0"}>{children}</div> : null}
      </div>
    </div>
  )
}

export { statusLabels }

