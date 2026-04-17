"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { deleteClubPost, getClubPageData, postClubDiscussion, updateClubPost } from "@/src/actions/clubs"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import ConfirmDeleteButton from "@/src/components/ui/confirm-delete-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

export default function ClubPostsPage() {
  const params = useParams<{ id: string }>()
  const clubId = params.id

  const [data, setData] = useState<Awaited<ReturnType<typeof getClubPageData>> | null>(null)
  const [pending, setPending] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isAnnouncement, setIsAnnouncement] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")

  const loadData = useCallback(async () => {
    try {
      setData(await getClubPageData(clubId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load posts")
    }
  }, [clubId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handlePost() {
    if (!title.trim() || !body.trim()) {
      toast.error("Post title and body are required")
      return
    }

    setPending(true)
    try {
      await postClubDiscussion(clubId, {
        title,
        body,
        isAnnouncement,
      })
      setTitle("")
      setBody("")
      setIsAnnouncement(false)
      toast.success("Posted")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post")
    } finally {
      setPending(false)
    }
  }

  async function handleDelete(postId: string) {
    setPending(true)
    try {
      await deleteClubPost(clubId, postId)
      toast.success("Post deleted")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    } finally {
      setPending(false)
    }
  }

  async function handleSaveEdit(postId: string) {
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error("Post title and body are required")
      return
    }

    setPending(true)
    try {
      await updateClubPost(clubId, postId, { title: editTitle, body: editBody })
      setEditingPostId(null)
      setEditTitle("")
      setEditBody("")
      toast.success("Post updated")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion posts</CardTitle>
        <CardDescription>Club conversation feed and updates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post title"
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="Post to the club"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {(data?.viewerMembership.role === "owner" || data?.viewerMembership.role === "moderator") ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={(event) => setIsAnnouncement(event.target.checked)}
              className="size-4"
            />
            Mark as announcement
          </label>
        ) : null}
        <div>
          <Button onClick={() => void handlePost()} disabled={pending}>
            Post message
          </Button>
        </div>

        <div className="space-y-2 pt-2">
          {data?.posts.length ? (
            data.posts.map((post) => (
              <div key={post.id} className="rounded-md border border-border/70 px-3 py-2">
                {editingPostId === post.id ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                    <textarea
                      value={editBody}
                      onChange={(event) => setEditBody(event.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" disabled={pending} onClick={() => void handleSaveEdit(post.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => {
                          setEditingPostId(null)
                          setEditTitle("")
                          setEditBody("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{post.title}</p>
                      {post.isAnnouncement ? <Badge className="mr-2 mt-2 shrink-0">Announcement</Badge> : null}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{post.body}</p>
                    <p className="text-xs text-muted-foreground">
                      @{post.author?.username ?? post.author?.email} · {new Date(post.createdAt).toLocaleString()}
                      {post.editedAt ? ` · edited ${new Date(post.editedAt).toLocaleString()}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {post.authorUserId === data.viewerUserId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            setEditingPostId(post.id)
                            setEditTitle(post.title)
                            setEditBody(post.body)
                          }}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {post.authorUserId === data.viewerUserId ||
                      data.viewerMembership.role === "owner" ||
                      data.viewerMembership.role === "moderator" ? (
                        <ConfirmDeleteButton
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onConfirmAction={() => handleDelete(post.id)}
                          label="Delete"
                        />
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No discussion posts yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

