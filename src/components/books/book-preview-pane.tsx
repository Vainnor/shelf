"use client"

import { Star } from "lucide-react"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { BookVisualSummary } from "@/src/components/books/book-visual-summary"
import type { BookInput } from "@/src/lib/books"

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
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const title = draft.title?.trim() || "Untitled book"
  const author = draft.author?.trim() || "Unknown author"
  const totalPages = getSafeNumber(draft.totalPages)
  const currentPage = Math.min(getSafeNumber(draft.currentPage), totalPages > 0 ? totalPages : Number.MAX_SAFE_INTEGER)
  const trimmedNotes = draft.notes?.trim() || ""


  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Live preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <BookVisualSummary
            title={title}
            author={author}
            status={draft.status ?? "to_read"}
            currentPage={currentPage}
            totalPages={totalPages}
            coverUrl={draft.coverUrl}
            isbn={draft.isbn}
            isFavorite={Boolean(draft.isFavorite)}
            variant="compact"
          />

          {typeof draft.dailyPageGoal === "number" && draft.dailyPageGoal > 0 ? (
            <p className="text-xs text-muted-foreground">Daily goal: {Math.floor(draft.dailyPageGoal)} pages</p>
          ) : null}

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

          {trimmedNotes ? (
            <div className="rounded-md border border-border/70 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                <button
                  type="button"
                  onClick={() => setIsNotesOpen((current) => !current)}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                >
                  {isNotesOpen ? "Hide notes" : "Show notes"}
                </button>
              </div>
              {isNotesOpen ? (
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">{trimmedNotes}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

