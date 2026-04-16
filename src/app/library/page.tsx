"use client"

import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import ProfileMenu from "@/src/components/auth/profile-menu"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import type { booksTable } from "@/src/db/schema/book"
import { getBooks } from "@/src/actions/books"
import { getSession } from "@/src/actions/auth"

export const dynamic = "force-dynamic"

type Book = typeof booksTable.$inferSelect
type Session = {
  user: {
    id: string
    email: string
    name?: string
    image?: string | null
    role?: "user" | "admin"
    username?: string | null
  }
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

export default function LibraryPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<"all" | "to_read" | "reading" | "read">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [minPages, setMinPages] = useState("")
  const [maxPages, setMaxPages] = useState("")
  const [minRating, setMinRating] = useState("")
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [createdFrom, setCreatedFrom] = useState("")
  const [createdTo, setCreatedTo] = useState("")

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

  // Fetch books
  const fetchBooks = async () => {
    setLoading(true)
    try {
      const data = await getBooks({
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
        minPages: minPages ? Number(minPages) : undefined,
        maxPages: maxPages ? Number(maxPages) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        isFavorite: favoriteOnly ? true : undefined,
        createdFrom: createdFrom ? new Date(`${createdFrom}T00:00:00`) : undefined,
        createdTo: createdTo ? new Date(`${createdTo}T23:59:59`) : undefined,
      })
      setBooks(data)
    } catch (error) {
      console.error("Error fetching books:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchBooks()
    }
  }, [session, selectedStatus, searchQuery, minPages, maxPages, minRating, favoriteOnly, createdFrom, createdTo])

  const displayName = session?.user?.name ?? session?.user?.email ?? "Guest"

  const booksWithCover = books.filter((b) => b.coverUrl)
  const booksWithoutCover = books.filter((b) => !b.coverUrl)

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <BookOpen className="size-3.5" />
              Library
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {displayName}&apos;s Bookshelf
            </h1>
            <p className="text-muted-foreground">
              View all your books displayed as they appear on a shelf.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "default" })}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
            <ProfileMenu
              name={session?.user?.name ?? ""}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
              username={session?.user?.username}
            />
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "to_read", "reading", "read"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status === "all"
                ? "All Books"
                : status === "to_read"
                  ? "To Read"
                  : status === "reading"
                    ? "Reading"
                    : "Finished"}
            </button>
          ))}
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title, author, ISBN"
            className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm"
          />
        </div>

        <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            type="number"
            min={0}
            value={minPages}
            onChange={(event) => setMinPages(event.target.value)}
            placeholder="Min pages"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="number"
            min={0}
            value={maxPages}
            onChange={(event) => setMaxPages(event.target.value)}
            placeholder="Max pages"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="number"
            min={1}
            max={5}
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            placeholder="Min rating"
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="date"
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <input
            type="date"
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <input
              type="checkbox"
              checked={favoriteOnly}
              onChange={(event) => setFavoriteOnly(event.target.checked)}
              className="size-4"
            />
            Favorites only
          </label>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading your bookshelf...</div>
        ) : books.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">No books in this category. Add some books to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Books with covers */}
            {booksWithCover.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Bookshelf</h2>
                <div className="relative">
                  {/* Shelf background decoration */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-900 rounded-sm" />
                  <div className="absolute bottom-1 left-0 right-0 h-px bg-amber-800" />

                  {/* Books grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
                    {booksWithCover.map((book) => (
                      <div key={book.id} className="group flex flex-col items-center cursor-pointer" onClick={() => router.push(`/books/${book.id}`)}>
                        <div className="relative w-full aspect-[2/3] mb-2 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                          <img
                            src={book.coverUrl || ""}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Status badge overlay */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className={statusColors[book.status]}>
                              {statusLabels[book.status as keyof typeof statusLabels]}
                            </Badge>
                          </div>

                          {/* Hover info */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                            <div className="text-white text-sm font-medium line-clamp-2">{book.title}</div>
                            <div className="text-gray-200 text-xs">{book.author}</div>
                          </div>
                        </div>
                        <div className="text-center w-full">
                          <h3 className="text-sm font-medium line-clamp-2">{book.title}</h3>
                          <p className="text-xs text-muted-foreground">{book.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Books without covers */}
            {booksWithoutCover.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Books Without Covers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {booksWithoutCover.map((book) => (
                    <Card
                      key={book.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/books/${book.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                          </div>
                          <Badge className={statusColors[book.status]}>
                            {statusLabels[book.status as keyof typeof statusLabels]}
                          </Badge>
                          {book.totalPages && (
                            <div className="text-xs text-muted-foreground">
                              {book.currentPage} / {book.totalPages} pages
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{books.length}</div>
                  <div className="text-sm text-muted-foreground">Total Books</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{books.filter((b) => b.status === "read").length}</div>
                  <div className="text-sm text-muted-foreground">Finished</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{books.filter((b) => b.status === "reading").length}</div>
                  <div className="text-sm text-muted-foreground">Reading</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

