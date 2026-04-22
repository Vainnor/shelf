"use client"

import { ArrowLeft, PencilLine } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { editBook, getBooks } from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"
import ProfileMenu from "@/src/components/auth/profile-menu"
import { BookComposer } from "@/src/components/books/book-composer"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import type { booksTable } from "@/src/db/schema/book"
import type { UserRole } from "@/src/db/schema/user"
import type { BookInput } from "@/src/lib/books"

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

function toDraft(book: Book): BookInput {
  return {
    title: book.title,
    author: book.author,
    status: book.status,
    totalPages: book.totalPages,
    currentPage: book.currentPage,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    notes: book.notes,
    rating: book.rating,
    review: book.review,
    isFavorite: book.isFavorite,
    dailyPageGoal: book.dailyPageGoal,
    targetFinishDate: book.targetFinishDate,
  }
}

export default function EditBookPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string

  const [session, setSession] = useState<Session>(null)
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)

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

    void fetchSession()
  }, [router])

  useEffect(() => {
    const fetchBook = async () => {
      if (!session?.user?.id) {
        return
      }

      setLoading(true)
      try {
        const books = await getBooks()
        const foundBook = books.find((item) => item.id === bookId)
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

    void fetchBook()
  }, [session?.user?.id, bookId, router])

  const displayName = useMemo(() => {
    return session?.user?.name ?? session?.user?.email ?? "Reader"
  }, [session])

  const handleSaveDraft = async (payload: BookInput) => {
    try {
      await editBook(bookId, payload)
      toast.success("Book updated")
      router.push(`/books/${bookId}`)
    } catch (error) {
      console.error("Error updating book:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update book")
      throw error
    }
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-6xl">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </section>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-6xl">
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">Book not found.</CardContent>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <PencilLine className="size-3.5" />
              Edit book
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Update your book entry</h1>
            <p className="text-muted-foreground">Keep details, progress, and metadata in sync.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/books/${bookId}`)} className="gap-2">
              <ArrowLeft className="size-4" />
              Back to detail
            </Button>
            <NotificationsButton />
            <ProfileMenu
              name={displayName}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
            />
          </div>
        </div>

        <BookComposer
          initialDraft={toDraft(book)}
          formTitle="Book details"
          formDescription="Make updates with a live preview before saving."
          submitLabel="Save changes"
          submittingLabel="Saving..."
          onSubmitDraftAction={handleSaveDraft}
          onCancelAction={() => router.push(`/books/${bookId}`)}
        />
      </section>
    </main>
  )
}

