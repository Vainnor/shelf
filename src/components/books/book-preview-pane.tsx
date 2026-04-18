"use client"

import { BookOpen, Star } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { BookInput } from "@/src/lib/books"

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

type BookPreviewPaneProps = {
  draft: BookInput
}

function getSafeNumber(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

export function BookPreviewPane({ draft }: BookPreviewPaneProps) {
  const title = draft.title?.trim() || "Untitled book"
  const author = draft.author?.trim() || "Unknown author"
  const status = draft.status ?? "to_read"
  const totalPages = getSafeNumber(draft.totalPages)
  const currentPage = Math.min(getSafeNumber(draft.currentPage), totalPages > 0 ? totalPages : Number.MAX_SAFE_INTEGER)
  const progressPercent = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Live preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="relative mx-auto w-full max-w-28 overflow-hidden rounded-md border border-border/70 bg-muted/30 aspect-2/3 sm:max-w-32 lg:max-w-36">
            {draft.coverUrl?.trim() ? (
              <img src={draft.coverUrl} alt={`${title} cover`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="size-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h2 className="line-clamp-2 text-base font-semibold tracking-tight">{title}</h2>
            <p className="line-clamp-1 text-sm text-muted-foreground">{author}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
              {draft.isbn?.trim() ? <Badge variant="outline">ISBN: {draft.isbn.trim()}</Badge> : null}
              {draft.isFavorite ? <Badge variant="outline">Favorite</Badge> : null}
            </div>
          </div>

          <div className="space-y-1.5 rounded-md border border-border/70 p-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {totalPages > 0 ? `${currentPage} / ${totalPages} pages` : `${currentPage} pages tracked`}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            {typeof draft.dailyPageGoal === "number" && draft.dailyPageGoal > 0 ? (
              <p className="text-xs text-muted-foreground">Daily goal: {Math.floor(draft.dailyPageGoal)} pages</p>
            ) : null}
          </div>

          <div className="space-y-1 text-xs">
            {typeof draft.rating === "number" && draft.rating > 0 ? (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="size-4 fill-current" />
                <span>{Math.min(5, Math.max(1, Math.floor(draft.rating)))}/5 rating</span>
              </div>
            ) : null}
            {draft.targetFinishDate ? (
              <p className="text-xs text-muted-foreground">
                Target finish: {new Date(draft.targetFinishDate).toLocaleDateString()}
              </p>
            ) : null}
          </div>

          {draft.notes?.trim() ? (
            <div className="space-y-1 rounded-md border border-border/70 p-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">{draft.notes.trim()}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

