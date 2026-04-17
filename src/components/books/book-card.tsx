"use client"

import { Edit, ArrowRight, Eye } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import ConfirmDeleteButton from "@/src/components/ui/confirm-delete-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import type { booksTable } from "@/src/db/schema/book"
import type { BookStatus } from "@/src/lib/books"

type Book = typeof booksTable.$inferSelect

interface BookCardProps {
  book: Book
  onView?: (book: Book) => void
  onEdit: (book: Book) => void
  onDelete: (bookId: string) => void
  onStatusChange: (bookId: string, newStatus: "to_read" | "reading" | "read") => void
}

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

export function BookCard({ book, onView, onEdit, onDelete, onStatusChange }: BookCardProps) {
  const progressPercent = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0

  const getNextStatus = (current: BookStatus): BookStatus => {
    switch (current) {
      case "to_read":
        return "reading"
      case "reading":
        return "read"
      case "read":
        return "to_read"
      default:
        return "to_read"
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2">{book.title}</CardTitle>
            <CardDescription>{book.author}</CardDescription>
          </div>
          <Badge className={statusColors[book.status]}>
            {statusLabels[book.status as keyof typeof statusLabels]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {book.totalPages && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {book.currentPage} / {book.totalPages} pages
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {book.notes && <p className="text-xs text-muted-foreground italic line-clamp-2">{book.notes}</p>}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(book.id, getNextStatus(book.status))}
            className="flex-1 gap-1 text-xs"
          >
            <ArrowRight className="size-3" />
            {statusLabels[getNextStatus(book.status) as keyof typeof statusLabels]}
          </Button>
          {onView && (
            <Button size="sm" variant="ghost" onClick={() => onView(book)}>
              <Eye className="size-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onEdit(book)}>
            <Edit className="size-4" />
          </Button>
          <ConfirmDeleteButton
            size="sm"
            variant="ghost"
            onConfirmAction={() => onDelete(book.id)}
            label="Delete"
            className="text-destructive hover:bg-destructive/10"
          />
        </div>
      </CardContent>
    </Card>
  )
}

