"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { lookupBookByIsbn } from "@/src/actions/books"
import type { BookInput, BookStatus } from "@/src/lib/books"
import type { booksTable } from "@/src/db/schema/book"

type Book = typeof booksTable.$inferSelect

interface BookFormProps {
  book?: Book
  onSubmit: (data: BookInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function BookForm({ book, onSubmit, onCancel, isLoading = false }: BookFormProps) {
  const [formData, setFormData] = useState<BookInput>(
    book
      ? {
          title: book.title,
          author: book.author,
          totalPages: book.totalPages,
          currentPage: book.currentPage,
          status: book.status,
          isbn: book.isbn,
          coverUrl: book.coverUrl,
          notes: book.notes,
        }
      : {
          title: "",
          author: "",
          totalPages: null,
          currentPage: 0,
          status: "to_read",
          isbn: null,
          coverUrl: null,
          notes: null,
        }
  )
  const [isLookupLoading, setIsLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseInt(value) : null) : value === "" ? null : value,
    }))
  }

  const handleLookupByIsbn = async () => {
    const isbn = formData.isbn?.trim()
    if (!isbn) {
      setLookupMessage("Enter an ISBN first.")
      return
    }

    setIsLookupLoading(true)
    setLookupMessage(null)

    try {
      const result = await lookupBookByIsbn(isbn)
      setFormData((prev) => ({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{book ? "Edit Book" : "Add New Book"}</CardTitle>
        <CardDescription>{book ? "Update your book details" : "Add a new book to your collection"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Book title"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Author *</label>
              <Input
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Author name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Pages</label>
              <Input
                name="totalPages"
                type="number"
                value={formData.totalPages || ""}
                onChange={handleChange}
                placeholder="Number of pages"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Page</label>
              <Input
                name="currentPage"
                type="number"
                value={formData.currentPage}
                onChange={handleChange}
                placeholder="0"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isLoading}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="to_read">To Read</option>
                <option value="reading">Currently Reading</option>
                <option value="read">Finished</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">ISBN</label>
              <div className="flex gap-2">
                <Input
                  name="isbn"
                  value={formData.isbn || ""}
                  onChange={handleChange}
                  placeholder="ISBN-10 or ISBN-13"
                  disabled={isLoading || isLookupLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLookupByIsbn}
                  disabled={isLoading || isLookupLoading}
                >
                  {isLookupLoading ? "Looking up..." : "Lookup"}
                </Button>
              </div>
              {lookupMessage && <p className="text-xs text-muted-foreground">{lookupMessage}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover URL</label>
              <Input
                name="coverUrl"
                value={formData.coverUrl || ""}
                onChange={handleChange}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder="Personal notes about the book"
              disabled={isLoading}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : book ? "Update Book" : "Add Book"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

