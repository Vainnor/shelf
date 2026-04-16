import Link from "next/link"

import { getClubPageData } from "@/src/actions/clubs"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { buttonVariants } from "@/src/components/ui/button"

export default async function ClubOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getClubPageData(id)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Members</p>
            <p className="text-2xl font-semibold">{data.members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Shelf books</p>
            <p className="text-2xl font-semibold">{data.books.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Posts</p>
            <p className="text-2xl font-semibold">{data.posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent activity</p>
            <p className="text-2xl font-semibold">{data.activity.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent shelf adds</CardTitle>
            <CardDescription>Latest books in the shared shelf.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.books.slice(0, 5).map((book) => (
              <div key={book.id} className="rounded-md border border-border/70 px-3 py-2">
                <p className="text-sm font-medium">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
            ))}
            <Link href={`/clubs/${id}/shelf`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open shelf
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent discussion</CardTitle>
            <CardDescription>Latest club messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.posts.slice(0, 5).map((post) => (
              <div key={post.id} className="rounded-md border border-border/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium">{post.title}</p>
                  {post.isAnnouncement ? <Badge>Announcement</Badge> : null}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
                <p className="text-xs text-muted-foreground">@{post.author?.username ?? post.author?.email}</p>
              </div>
            ))}
            <Link href={`/clubs/${id}/posts`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open posts
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

