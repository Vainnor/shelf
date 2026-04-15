"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Edit2, Trash2, BookOpen } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { booksTable } from "@/src/db/schema/book"
import { getBooks, removeBook, changeBookStatus } from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"
import ProfileMenu from "@/src/components/auth/profile-menu"

export const dynamic = "force-dynamic"

type Book = typeof booksTable.$inferSelect
type Session = {
  user: { id: string; email: string; name?: string; image?: string | null; role?: "user" | "admin" }
} | null

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

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [session, setSession] = useState<Session>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSession()
        if (!sessionData) {
          router.push("/login")
          return
        }
        setSession(sessionData)
      } catch (error) {
        console.error("Error fetching session:", error)
        router.push("/login")
      }
    }

    fetchSession()
  }, [router])

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      if (!session?.user?.id) return

      setLoading(true)
      try {
        const books = await getBooks()
        const foundBook = books.find((b) => b.id === bookId)
        if (!foundBook) {
          router.push("/dashboard")
          return
        }
        setBook(foundBook)
      } catch (error) {
        console.error("Error fetching book:", error)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBook()
  }, [session?.user?.id, bookId, router])

  const handleDelete = async () => {
    if (!book || !confirm("Are you sure you want to delete this book?")) return

    setIsDeleting(true)
    try {
      await removeBook(book.id)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Failed to delete book")
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: "to_read" | "reading" | "read") => {
    if (!book) return

    try {
      await changeBookStatus(book.id, newStatus)
      // Update local state
      setBook({ ...book, status: newStatus })
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    }
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-4xl">
          <div className="text-center text-muted-foreground">Loading book details...</div>
        </section>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-4xl">
          <Button variant="outline" onClick={() => router.back()} className="gap-2 mb-6">
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Book not found</p>
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  const progressPercent = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0
  const formattedStartDate = book.startedAt ? new Date(book.startedAt).toLocaleDateString() : null
  const formattedFinishDate = book.finishedAt ? new Date(book.finishedAt).toLocaleDateString() : null

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <ProfileMenu
            name={session?.user?.name ?? ""}
            email={session?.user?.email ?? ""}
            image={session?.user?.image}
            isAdmin={session?.user?.role === "admin"}
          />
        </div>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Book Cover */}
          <div className="md:col-span-1">
            {book.coverUrl ? (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[2/3] rounded-lg bg-muted flex items-center justify-center">
                <BookOpen className="size-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Title and basic info */}
            <div className="space-y-3">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
                <p className="text-lg text-muted-foreground">{book.author}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[book.status]}>
                  {statusLabels[book.status as keyof typeof statusLabels]}
                </Badge>
                {book.isbn && <Badge variant="outline">ISBN: {book.isbn}</Badge>}
              </div>
            </div>

            {/* Status buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Change Status:</p>
              <div className="flex gap-2 flex-wrap">
                {(["to_read", "reading", "read"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={book.status === status ? "default" : "outline"}
                    onClick={() => handleStatusChange(status)}
                  >
                    {statusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Progress */}
            {book.totalPages && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reading Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{book.currentPage} pages read</span>
                      <span className="text-muted-foreground">of {book.totalPages} pages</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{progressPercent}% Complete</div>
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Added:</span>
                  <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                </div>
                {formattedStartDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{formattedStartDate}</span>
                  </div>
                )}
                {formattedFinishDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Finished:</span>
                    <span>{formattedFinishDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard?edit=${book.id}`)}
                className="gap-2"
              >
                <Edit2 className="size-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {book.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{book.notes}</p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}

