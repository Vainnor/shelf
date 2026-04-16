import type { Metadata } from "next"
import { ArrowLeft, BookOpen, Heart, Quote, Sparkles, Star, Users } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getPublicProfileByUsername } from "@/src/actions/social"
import FollowButton from "@/src/components/social/follow-button"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

export const dynamic = "force-dynamic"

function buildPublicProfileUrl(username: string) {
  const origin = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL
  if (!origin || !/^https?:\/\//i.test(origin)) {
    return undefined
  }

  return `${origin.replace(/\/$/, "")}/u/${username}`
}

function formatBadgeList(stats: {
  read: number
  reviewedCount: number
  followers: number
  favoriteCount: number
}) {
  const badges: string[] = []

  if (stats.read >= 25) badges.push("Avid reader")
  if (stats.reviewedCount >= 5) badges.push("Reviewer")
  if (stats.followers >= 10) badges.push("Community favorite")
  if (stats.favoriteCount >= 5) badges.push("Curator")

  if (badges.length === 0) {
    badges.push("Getting started")
  }

  return badges
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await getPublicProfileByUsername(username)

  if (!profile) {
    return {
      title: "Reader profile not found | Shelf",
      description: "This public profile is not available.",
    }
  }

  const displayName = profile.user.name || profile.user.username
  const description = `${displayName} on Shelf: ${profile.stats.read} books read, ${profile.stats.reading} currently reading, ${profile.stats.followers} followers.`
  const url = buildPublicProfileUrl(profile.user.username)

  return {
    title: `${displayName} (@${profile.user.username}) | Shelf`,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: `${displayName} on Shelf`,
      description,
      url,
      type: "profile",
      images: url ? [{ url: `${url}/opengraph-image` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} on Shelf`,
      description,
      images: url ? [`${url}/opengraph-image`] : undefined,
    },
  }
}

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

  const badges = formatBadgeList(profile.stats)

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
            <div className="flex flex-wrap gap-2 pt-1">
              {badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="gap-1.5">
                  <Sparkles className="size-3" />
                  {badge}
                </Badge>
              ))}
            </div>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reviewed</p>
              <p className="text-2xl font-semibold">{profile.stats.reviewedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Favorites</p>
              <p className="text-2xl font-semibold">{profile.stats.favoriteCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pages tracked</p>
              <p className="text-2xl font-semibold">{profile.stats.pagesTracked.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {profile.preferences.publicShowHighlights ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="size-4" />
                Recent highlights
              </CardTitle>
              <CardDescription>Favorite lines this reader chose to share publicly.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profile.recentHighlights.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public highlights yet.</p>
              ) : (
                profile.recentHighlights.map((highlight) => (
                  <div key={highlight.id} className="rounded-md border border-border/70 p-3">
                    <p className="line-clamp-4 text-sm leading-6">&ldquo;{highlight.quote}&rdquo;</p>
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      {highlight.bookTitle} - {highlight.bookAuthor}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {highlight.page ? `Page ${highlight.page} - ` : ""}
                      {new Date(highlight.highlightedAt ?? highlight.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Recent books
            </CardTitle>
            <CardDescription>Latest updates from this reader&apos;s library.</CardDescription>
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
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {book.rating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5" />
                        {book.rating}/5
                      </span>
                    ) : null}
                    {book.isFavorite ? (
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3.5" />
                        Favorite
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

