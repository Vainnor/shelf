import { ArrowLeft, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getPublicProfileByUsername } from "@/src/actions/social"
import FollowButton from "@/src/components/social/follow-button"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

export const dynamic = "force-dynamic"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const profile = await getPublicProfileByUsername(username)

  if (!profile) {
    notFound()
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <Users className="size-3.5" />
              Public profile
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {profile.user.name || profile.user.username}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.user.username}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/social"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
            >
              <ArrowLeft className="size-4" />
              Social
            </Link>
            {!profile.viewer.isOwnProfile && profile.viewer.isLoggedIn ? (
              <FollowButton username={profile.user.username} isFollowing={profile.viewer.isFollowing} />
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Books</p>
              <p className="text-2xl font-semibold">{profile.stats.totalBooks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">To read</p>
              <p className="text-2xl font-semibold">{profile.stats.toRead}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reading</p>
              <p className="text-2xl font-semibold">{profile.stats.reading}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Read</p>
              <p className="text-2xl font-semibold">{profile.stats.read}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Followers</p>
              <p className="text-2xl font-semibold">{profile.stats.followers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Following</p>
              <p className="text-2xl font-semibold">{profile.stats.following}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Recent books
            </CardTitle>
            <CardDescription>Latest updates from this reader's library.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.recentBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent books yet.</p>
            ) : (
              profile.recentBooks.map((book) => (
                <div key={book.id} className="rounded-md border border-border/70 p-3">
                  <p className="line-clamp-1 text-sm font-medium">{book.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {book.status}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

