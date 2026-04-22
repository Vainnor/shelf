"use client"

import { type DragEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { getSession } from "@/src/actions/auth"
import { getBooks, persistBoardOrder } from "@/src/actions/books"
import ProfileMenu from "@/src/components/auth/profile-menu"
import PageHeader from "@/src/components/layout/page-header"
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
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null)
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

  const grouped = useMemo(() => {
    const sortByRank = (items: Book[]) =>
      [...items].sort((a, b) => {
        if (a.manualRank !== b.manualRank) {
          return a.manualRank - b.manualRank
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

    return {
      to_read: sortByRank(books.filter((book) => book.status === "to_read")),
      reading: sortByRank(books.filter((book) => book.status === "reading")),
      read: sortByRank(books.filter((book) => book.status === "read")),
    }
  }, [books])

  async function persistOrder(nextBooks: Book[]) {
    const byStatus: Record<BookStatus, string[]> = {
      to_read: nextBooks
        .filter((item) => item.status === "to_read")
        .sort((a, b) => a.manualRank - b.manualRank)
        .map((item) => item.id),
      reading: nextBooks
        .filter((item) => item.status === "reading")
        .sort((a, b) => a.manualRank - b.manualRank)
        .map((item) => item.id),
      read: nextBooks
        .filter((item) => item.status === "read")
        .sort((a, b) => a.manualRank - b.manualRank)
        .map((item) => item.id),
    }

    await persistBoardOrder({ byStatus })
  }

  function reorderList(ids: string[], movingId: string, insertIndex: number) {
    const withoutMoving = ids.filter((id) => id !== movingId)
    const safeIndex = Math.max(0, Math.min(insertIndex, withoutMoving.length))
    withoutMoving.splice(safeIndex, 0, movingId)
    return withoutMoving
  }

  async function moveBook(book: Book, nextStatus: BookStatus, insertIndex: number) {
    if (movingBookId) {
      return
    }

    setMovingBookId(book.id)
    const previousBooks = books

    const fromIds = grouped[book.status].map((item) => item.id)
    const toIds = grouped[nextStatus].map((item) => item.id)
    const nextFromIds = book.status === nextStatus ? reorderList(fromIds, book.id, insertIndex) : fromIds.filter((id) => id !== book.id)
    const nextToIds = reorderList(book.status === nextStatus ? nextFromIds : toIds, book.id, insertIndex)

    const rankById = new Map<string, { status: BookStatus; manualRank: number }>()
    nextFromIds.forEach((id, index) => rankById.set(id, { status: book.status, manualRank: index }))
    nextToIds.forEach((id, index) => rankById.set(id, { status: nextStatus, manualRank: index }))

    const optimistic = books.map((item) => {
      const next = rankById.get(item.id)
      if (!next) return item
      return {
        ...item,
        status: next.status,
        manualRank: next.manualRank,
      }
    })

    setBooks(optimistic)

    try {
      await persistOrder(optimistic)
      setJustMovedBookId(book.id)
      toast.success(`Moved to ${statusColumns.find((column) => column.key === nextStatus)?.label ?? "new column"}`)
    } catch (error) {
      console.error("Failed to move book", error)
      setBooks(previousBooks)
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
    setDragOverBookId(null)
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
    setDragOverStatus(null)
    setDraggingBookId(null)
    setDragOverBookId(null)

    if (!draggedId) {
      return
    }

    const book = getBookById(draggedId)
    if (!book) {
      return
    }

    const insertIndex = grouped[status].length
    await moveBook(book, status, insertIndex)
  }

  function handleCardDragOver(event: DragEvent<HTMLDivElement>, bookId: string, status: BookStatus) {
    event.preventDefault()
    event.stopPropagation()
    setDragOverStatus(status)
    setDragOverBookId(bookId)
  }

  async function handleCardDrop(event: DragEvent<HTMLDivElement>, targetBook: Book) {
    event.preventDefault()
    event.stopPropagation()

    const draggedId = event.dataTransfer.getData("text/book-id")
    if (!draggedId || draggedId === targetBook.id) {
      return
    }

    const book = getBookById(draggedId)
    if (!book) {
      return
    }

    const targetIndex = grouped[targetBook.status].findIndex((item) => item.id === targetBook.id)
    setDragOverBookId(null)
    setDragOverStatus(null)
    setDraggingBookId(null)
    await moveBook(book, targetBook.status, targetIndex)
  }

  if (loading) {
    return (
      <main className="relative isolate min-h-svh overflow-hidden bg-background p-6 lg:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-45 bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-background/85 to-muted/10" />

        <section className="relative z-10 mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">Loading board...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-background p-6 lg:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-45 bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-background/85 to-muted/10" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          title="Books kanban"
          description="Drag-and-drop board for quickly scanning and moving books between shelf groups."
          breadcrumbCurrentLabel="Board"
          actions={(
            <>
              <NotificationsButton />
              <ProfileMenu
                name={session?.user?.name ?? ""}
                email={session?.user?.email ?? ""}
                image={session?.user?.image}
                isAdmin={session?.user?.role === "admin"}
              />
            </>
          )}
        />

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
                        onDragOver={(event) => handleCardDragOver(event, book.id, column.key)}
                        onDrop={(event) => void handleCardDrop(event, book)}
                        className={cn(
                          "space-y-2 rounded-md border border-border/70 p-3",
                          "cursor-grab active:cursor-grabbing",
                          "transition-all duration-500",
                          draggingBookId === book.id && "scale-[0.99] opacity-55",
                          justMovedBookId === book.id && "-translate-y-0.5 bg-primary/10 ring-1 ring-primary/50",
                          dragOverBookId === book.id && "ring-1 ring-primary/50"
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
                                  onClick={() =>
                                    void moveBook(book, candidate.key, grouped[candidate.key].length)
                                  }
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
