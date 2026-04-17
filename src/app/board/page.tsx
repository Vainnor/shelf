"use client"

import { ArrowLeft, KanbanSquare } from "lucide-react"
import Link from "next/link"
import { type DragEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { getSession } from "@/src/actions/auth"
import { changeBookStatus, getBooks } from "@/src/actions/books"
import ProfileMenu from "@/src/components/auth/profile-menu"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
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
    username?: string | null
  }
} | null

const statusColumns: Array<{ key: BookStatus; label: string; hint: string }> = [
  { key: "to_read", label: "To Read", hint: "Books queued up next" },
  { key: "reading", label: "Reading", hint: "Books currently in progress" },
  { key: "read", label: "Finished", hint: "Completed books" },
]

export default function BoardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [movingBookId, setMovingBookId] = useState<string | null>(null)
  const [draggingBookId, setDraggingBookId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<BookStatus | null>(null)
  const [touchFallback, setTouchFallback] = useState(false)
  const [justMovedBookId, setJustMovedBookId] = useState<string | null>(null)

  useEffect(() => {
    const boot = async () => {
      try {
        const sessionData = await getSession()
        if (!sessionData) {
          router.push("/login")
          return
        }
        setSession(sessionData)

        const allBooks = await getBooks()
        setBooks(allBooks)
      } catch (error) {
        console.error("Failed to load board", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    void boot()
  }, [router])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const prefersCoarsePointer = window.matchMedia("(pointer: coarse)").matches
    const supportsNativeDrag = "draggable" in document.createElement("div")
    setTouchFallback(prefersCoarsePointer || !supportsNativeDrag)
  }, [])

  useEffect(() => {
    if (!justMovedBookId) {
      return
    }

    const timeout = window.setTimeout(() => {
      setJustMovedBookId(null)
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [justMovedBookId])

  const grouped = useMemo(
    () => ({
      to_read: books.filter((book) => book.status === "to_read"),
      reading: books.filter((book) => book.status === "reading"),
      read: books.filter((book) => book.status === "read"),
    }),
    [books]
  )

  async function moveBook(book: Book, nextStatus: BookStatus) {
    if (book.status === nextStatus || movingBookId) {
      return
    }

    setMovingBookId(book.id)
    try {
      await changeBookStatus(book.id, nextStatus)
      const refreshed = await getBooks()
      setBooks(refreshed)
      setJustMovedBookId(book.id)
      toast.success(`Moved to ${statusColumns.find((column) => column.key === nextStatus)?.label ?? "new column"}`)
    } catch (error) {
      console.error("Failed to move book", error)
      toast.error("Failed to move book")
    } finally {
      setMovingBookId(null)
    }
  }

  function getBookById(bookId: string) {
    return books.find((book) => book.id === bookId) ?? null
  }

  function handleCardDragStart(event: DragEvent<HTMLDivElement>, book: Book) {
    event.dataTransfer.setData("text/book-id", book.id)
    event.dataTransfer.setData("text/book-status", book.status)
    event.dataTransfer.effectAllowed = "move"

    // Build a styled drag ghost so dragging feels intentional and polished.
    const ghost = event.currentTarget.cloneNode(true) as HTMLDivElement
    ghost.style.position = "fixed"
    ghost.style.top = "-1000px"
    ghost.style.left = "-1000px"
    ghost.style.width = `${event.currentTarget.clientWidth}px`
    ghost.style.opacity = "0.94"
    ghost.style.transform = "rotate(1.5deg)"
    ghost.style.boxShadow = "0 10px 24px rgba(0,0,0,0.28)"
    ghost.style.borderColor = "hsl(var(--primary))"
    ghost.style.background = "hsl(var(--background))"
    ghost.style.pointerEvents = "none"
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 24, 20)
    window.setTimeout(() => ghost.remove(), 0)

    setDraggingBookId(book.id)
  }

  function handleCardDragEnd() {
    setDraggingBookId(null)
    setDragOverStatus(null)
  }

  function handleColumnDragOver(event: DragEvent<HTMLDivElement>, status: BookStatus) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDragOverStatus(status)
  }

  function handleColumnDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDragOverStatus(null)
    }
  }

  async function handleColumnDrop(event: DragEvent<HTMLDivElement>, status: BookStatus) {
    event.preventDefault()

    const draggedId = event.dataTransfer.getData("text/book-id")
    const draggedStatus = event.dataTransfer.getData("text/book-status") as BookStatus
    setDragOverStatus(null)
    setDraggingBookId(null)

    if (!draggedId || draggedStatus === status) {
      return
    }

    const book = getBookById(draggedId)
    if (!book) {
      return
    }

    await moveBook(book, status)
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">Loading board...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <KanbanSquare className="size-3.5" />
              Shelf board
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Books kanban</h1>
            <p className="text-muted-foreground">
              Drag-and-drop board for quickly scanning and moving books between shelf groups.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <NotificationsButton />
            <ProfileMenu
              name={session?.user?.name ?? ""}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
              username={session?.user?.username}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {statusColumns.map((column) => (
            <Card key={column.key}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-lg">
                  <span>{column.label}</span>
                  <Badge variant="secondary">{grouped[column.key].length}</Badge>
                </CardTitle>
                <CardDescription>{column.hint}</CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  "space-y-3 transition-colors",
                  dragOverStatus === column.key && "rounded-md bg-muted/40 ring-1 ring-primary/40"
                )}
                onDragOver={(event) => handleColumnDragOver(event, column.key)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(event) => void handleColumnDrop(event, column.key)}
              >
                {dragOverStatus === column.key ? (
                  <div className="rounded-md border border-dashed border-primary/60 bg-primary/5 px-3 py-2 text-xs text-primary">
                    Drop here to move to {column.label}
                  </div>
                ) : null}

                {grouped[column.key].length === 0 ? (
                  <p className="rounded-md border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                    No books in this column.
                  </p>
                ) : (
                  grouped[column.key].map((book) => {
                    const totalPages = book.totalPages ?? 0
                    const currentPage = Math.max(0, book.currentPage ?? 0)
                    const progressPercent =
                      totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0

                    return (
                      <div
                        key={book.id}
                        draggable
                        onDragStart={(event) => handleCardDragStart(event, book)}
                        onDragEnd={handleCardDragEnd}
                        className={cn(
                          "space-y-2 rounded-md border border-border/70 p-3",
                          "cursor-grab active:cursor-grabbing",
                          "transition-all duration-500",
                          draggingBookId === book.id && "scale-[0.99] opacity-55",
                          justMovedBookId === book.id && "-translate-y-0.5 bg-primary/10 ring-1 ring-primary/50"
                        )}
                      >
                        <button
                          className="line-clamp-2 text-left text-sm font-medium hover:underline"
                          onClick={() => router.push(`/books/${book.id}`)}
                        >
                          {book.title}
                        </button>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {totalPages > 0
                                ? `${currentPage} / ${totalPages} pages`
                                : `${currentPage} pages tracked`}
                            </span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>

                        <p className="pt-1 text-xs text-muted-foreground">
                          {touchFallback
                            ? "Use the Move to buttons below on touch devices."
                            : "Drag this card to another column to move it."}
                        </p>

                        {touchFallback ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {statusColumns
                              .filter((candidate) => candidate.key !== book.status)
                              .map((candidate) => (
                                <button
                                  key={`${book.id}-touch-${candidate.key}`}
                                  type="button"
                                  onClick={() => void moveBook(book, candidate.key)}
                                  disabled={movingBookId === book.id}
                                  className={cn(
                                    buttonVariants({ variant: "outline", size: "sm" }),
                                    "h-7 px-2 text-xs"
                                  )}
                                >
                                  {movingBookId === book.id ? "Moving..." : `Move to ${candidate.label}`}
                                </button>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}

