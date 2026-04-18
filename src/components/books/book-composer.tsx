"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { toast } from "sonner"

import { lookupBookByIsbn } from "@/src/actions/books"
import { BookPreviewPane } from "@/src/components/books"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import type { BookInput } from "@/src/lib/books"

type FormFieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>

type BookComposerProps = {
  initialDraft: BookInput
  formTitle: string
  formDescription: string
  submitLabel: string
  submittingLabel: string
  onSubmitDraftAction: (payload: BookInput) => Promise<void>
  onCancelAction: () => void
}

function normalizeNumeric(value: string) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return Math.floor(parsed)
}

function toDateInputValue(value: BookInput["targetFinishDate"]) {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().slice(0, 10)
}

export function sanitizeDraft(input: BookInput): BookInput {
  const totalPages =
    input.totalPages === null || input.totalPages === undefined ? null : Math.max(0, Math.floor(input.totalPages))
  const currentPageRaw =
    input.currentPage === null || input.currentPage === undefined ? 0 : Math.max(0, Math.floor(input.currentPage))
  const currentPage = totalPages !== null ? Math.min(currentPageRaw, totalPages) : currentPageRaw

  return {
    ...input,
    title: input.title.trim(),
    author: input.author.trim(),
    status: input.status ?? "to_read",
    totalPages,
    currentPage,
    isbn: input.isbn?.trim() || null,
    coverUrl: input.coverUrl?.trim() || null,
    notes: input.notes?.trim() || null,
    review: input.review?.trim() || null,
    rating:
      input.rating === null || input.rating === undefined
        ? null
        : Math.min(5, Math.max(1, Math.floor(input.rating))),
    dailyPageGoal:
      input.dailyPageGoal === null || input.dailyPageGoal === undefined
        ? null
        : Math.max(0, Math.floor(input.dailyPageGoal)),
  }
}

export function BookComposer({
  initialDraft,
  formTitle,
  formDescription,
  submitLabel,
  submittingLabel,
  onSubmitDraftAction,
  onCancelAction,
}: BookComposerProps) {
  const [draft, setDraft] = useState<BookInput>(initialDraft)
  const [isSaving, setIsSaving] = useState(false)
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(initialDraft)
  }, [initialDraft])

  const handleFieldChange = (event: FormFieldEvent) => {
    const { name, value, type } = event.target

    if (name === "targetFinishDate") {
      setDraft((prev) => ({
        ...prev,
        targetFinishDate: value ? new Date(`${value}T00:00:00`) : null,
      }))
      return
    }

    if (type === "checkbox") {
      const checked = (event.target as HTMLInputElement).checked
      setDraft((prev) => ({
        ...prev,
        [name]: checked,
      }))
      return
    }

    if (type === "number") {
      setDraft((prev) => ({
        ...prev,
        [name]: normalizeNumeric(value),
      }))
      return
    }

    setDraft((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }))
  }

  const handleLookupByIsbn = async () => {
    const isbn = draft.isbn?.trim()
    if (!isbn) {
      setLookupMessage("Enter an ISBN first.")
      return
    }

    setIsLookupLoading(true)
    setLookupMessage(null)

    try {
      const result = await lookupBookByIsbn(isbn)
      setDraft((prev) => ({
        ...prev,
        title: result.title,
        author: result.author,
        totalPages: result.totalPages,
        coverUrl: result.coverUrl,
        isbn: result.isbn,
        notes: prev.notes?.trim() ? prev.notes : result.notes,
      }))
      setLookupMessage("Book details loaded from ISBN.")
    } catch (error) {
      setLookupMessage(error instanceof Error ? error.message : "ISBN lookup failed")
    } finally {
      setIsLookupLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const payload = sanitizeDraft(draft)
    if (!payload.title) {
      toast.error("Title is required")
      return
    }

    if (!payload.author) {
      toast.error("Author is required")
      return
    }

    setIsSaving(true)
    try {
      await onSubmitDraftAction(payload)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid items-start gap-4 sm:grid-cols-[180px,minmax(0,1fr)] md:grid-cols-[210px,minmax(0,1fr)] lg:grid-cols-[240px,minmax(0,1fr)]">
      <div className="order-2 sm:order-1 sm:sticky sm:top-4 sm:self-start">
        <BookPreviewPane draft={draft} />
      </div>

      <Card className="order-1 sm:order-2">
        <CardHeader>
          <CardTitle className="text-xl">{formTitle}</CardTitle>
          <CardDescription>{formDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 lg:p-6 lg:pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basics</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    name="title"
                    value={draft.title}
                    onChange={handleFieldChange}
                    placeholder="Book title"
                    required
                    disabled={isSaving}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author *</label>
                  <Input
                    name="author"
                    value={draft.author}
                    onChange={handleFieldChange}
                    placeholder="Author name"
                    required
                    disabled={isSaving}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    name="status"
                    value={draft.status ?? "to_read"}
                    onChange={handleFieldChange}
                    disabled={isSaving}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="to_read">To Read</option>
                    <option value="reading">Currently Reading</option>
                    <option value="read">Finished</option>
                  </select>
                </div>
                <label className="inline-flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm font-medium">
                  <input
                    name="isFavorite"
                    type="checkbox"
                    checked={Boolean(draft.isFavorite)}
                    onChange={handleFieldChange}
                    disabled={isSaving}
                    className="size-4 rounded border-border"
                  />
                  Mark as favorite
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Progress</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total pages</label>
                  <Input
                    name="totalPages"
                    type="number"
                    min={0}
                    value={draft.totalPages ?? ""}
                    onChange={handleFieldChange}
                    disabled={isSaving}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current page</label>
                  <Input
                    name="currentPage"
                    type="number"
                    min={0}
                    value={draft.currentPage ?? 0}
                    onChange={handleFieldChange}
                    disabled={isSaving}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Daily page goal</label>
                  <Input
                    name="dailyPageGoal"
                    type="number"
                    min={0}
                    value={draft.dailyPageGoal ?? ""}
                    onChange={handleFieldChange}
                    disabled={isSaving}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium">Target finish date</label>
                <Input
                  name="targetFinishDate"
                  type="date"
                  value={toDateInputValue(draft.targetFinishDate)}
                  onChange={handleFieldChange}
                  disabled={isSaving}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metadata</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ISBN</label>
                  <div className="flex gap-2">
                    <Input
                      name="isbn"
                      value={draft.isbn ?? ""}
                      onChange={handleFieldChange}
                      placeholder="ISBN-10 or ISBN-13"
                      disabled={isSaving || isLookupLoading}
                      className="h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLookupByIsbn}
                      disabled={isSaving || isLookupLoading}
                      className="h-10"
                    >
                      {isLookupLoading ? <Loader2 className="size-4 animate-spin" /> : "Lookup"}
                    </Button>
                  </div>
                  {lookupMessage ? <p className="text-xs text-muted-foreground">{lookupMessage}</p> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover URL</label>
                  <Input
                    name="coverUrl"
                    value={draft.coverUrl ?? ""}
                    onChange={handleFieldChange}
                    placeholder="https://..."
                    disabled={isSaving}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium">Rating (1-5)</label>
                <Input
                  name="rating"
                  type="number"
                  min={1}
                  max={5}
                  value={draft.rating ?? ""}
                  onChange={handleFieldChange}
                  disabled={isSaving}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reflection</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={draft.notes ?? ""}
                  onChange={handleFieldChange}
                  placeholder="Personal notes about the book"
                  disabled={isSaving}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short review</label>
                <textarea
                  name="review"
                  value={draft.review ?? ""}
                  onChange={handleFieldChange}
                  placeholder="What did you think of this book?"
                  disabled={isSaving}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancelAction} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSaving ? submittingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

