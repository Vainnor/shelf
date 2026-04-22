"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { addBook } from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"
import ProfileMenu from "@/src/components/auth/profile-menu"
import { BookComposer } from "@/src/components/books/book-composer"
import PageHeader from "@/src/components/layout/page-header"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import type { UserRole } from "@/src/db/schema/user"
import type { BookInput } from "@/src/lib/books"

export const dynamic = "force-dynamic"

type Session = {
  user: {
    id: string
    email: string
    name?: string
    image?: string | null
    role?: UserRole
  }
} | null

const defaultBookDraft: BookInput = {
  title: "",
  author: "",
  status: "to_read",
  totalPages: null,
  currentPage: 0,
  isbn: null,
  coverUrl: null,
  notes: null,
  rating: null,
  review: null,
  isFavorite: false,
  dailyPageGoal: null,
  targetFinishDate: null,
}

export default function NewBookPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

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
      } finally {
        setIsSessionLoading(false)
      }
    }

    void fetchSession()
  }, [router])

  const displayName = useMemo(() => {
    return session?.user?.name ?? session?.user?.email ?? "Reader"
  }, [session])

  const handleSubmitDraft = async (payload: BookInput) => {
    try {
      const createdBook = await addBook(payload)
      toast.success("Book added to your library")
      router.push(`/books/${createdBook.id}`)
    } catch (error) {
      console.error("Error adding book:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add book")
    }
  }

  if (isSessionLoading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto w-full max-w-6xl">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PageHeader
          title="Create a book entry"
          description="Build your shelf entry with a live preview while you type."
          breadcrumbCurrentLabel="New"
          actions={(
            <>
              <NotificationsButton />
              <ProfileMenu
                name={displayName}
                email={session?.user?.email ?? ""}
                image={session?.user?.image}
                isAdmin={session?.user?.role === "admin"}
              />
            </>
          )}
        />

        <BookComposer
          initialDraft={defaultBookDraft}
          formTitle="Book details"
          formDescription="Uniform fields and clearer grouping for faster entry."
          submitLabel="Add book"
          submittingLabel="Saving..."
          onSubmitDraftAction={handleSubmitDraft}
          onCancelAction={() => router.push("/dashboard")}
        />
      </section>
    </main>
  )
}
