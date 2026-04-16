"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { addBookToClubShelf, getClubPageData, removeBookFromClubShelf } from "@/src/actions/clubs"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

export default function ClubShelfPage() {
  const params = useParams<{ id: string }>()
  const clubId = params.id

  const [data, setData] = useState<Awaited<ReturnType<typeof getClubPageData>> | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [bookTitle, setBookTitle] = useState("")
  const [bookAuthor, setBookAuthor] = useState("")
  const [bookNotes, setBookNotes] = useState("")

  const loadData = useCallback(async () => {
    try {
      setData(await getClubPageData(clubId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load shelf")
    }
  }, [clubId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleAddBook() {
    if (!bookTitle.trim() || !bookAuthor.trim()) {
      toast.error("Book title and author are required")
      return
    }

    setPendingAction("add")
    try {
      await addBookToClubShelf({ clubId, title: bookTitle, author: bookAuthor, notes: bookNotes })
      setBookTitle("")
      setBookAuthor("")
      setBookNotes("")
      toast.success("Book added")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add book")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRemoveBook(bookId: string) {
    setPendingAction(`remove-${bookId}`)
    try {
      await removeBookFromClubShelf(clubId, bookId)
      toast.success("Book removed")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove book")
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared shelf</CardTitle>
        <CardDescription>Collaborative list of books for the club.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={bookTitle}
            onChange={(event) => setBookTitle(event.target.value)}
            placeholder="Book title"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            value={bookAuthor}
            onChange={(event) => setBookAuthor(event.target.value)}
            placeholder="Author"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <textarea
          value={bookNotes}
          onChange={(event) => setBookNotes(event.target.value)}
          rows={2}
          placeholder="Notes (optional)"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button onClick={() => void handleAddBook()} disabled={pendingAction === "add"}>
          Add to shelf
        </Button>

        <div className="space-y-2 pt-2">
          {data?.books.length ? (
            data.books.map((book) => (
              <div key={book.id} className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                  <p className="text-xs text-muted-foreground">Added by @{book.addedBy?.username ?? book.addedBy?.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingAction === `remove-${book.id}`}
                  onClick={() => void handleRemoveBook(book.id)}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No books in this club shelf yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

