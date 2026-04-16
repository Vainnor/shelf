"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, Plus, Users } from "lucide-react"

import { getSession } from "@/src/actions/auth"
import {
  createBookClub,
  followUserByUsername,
  getSocialHomeData,
  joinBookClub,
  leaveBookClub,
  unfollowUserByUsername,
} from "@/src/actions/social"
import { getMyPendingClubInvites, respondToClubInvite } from "@/src/actions/clubs"
import ProfileMenu from "@/src/components/auth/profile-menu"
import { Badge } from "@/src/components/ui/badge"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import type { UserRole } from "@/src/db/schema/user"
import { cn } from "@/src/lib/utils"

export const dynamic = "force-dynamic"

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

type SocialData = Awaited<ReturnType<typeof getSocialHomeData>> | null
type PendingInvites = Awaited<ReturnType<typeof getMyPendingClubInvites>>

export default function SocialPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session>(null)
  const [data, setData] = useState<SocialData>(null)
  const [loading, setLoading] = useState(true)
  const [clubName, setClubName] = useState("")
  const [clubDescription, setClubDescription] = useState("")
  const [creatingClub, setCreatingClub] = useState(false)
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [pendingClub, setPendingClub] = useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = useState<PendingInvites>([])
  const [pendingInviteAction, setPendingInviteAction] = useState<string | null>(null)

  async function refreshSocialData() {
    try {
      const socialData = await getSocialHomeData()
      const invites = await getMyPendingClubInvites()
      setData(socialData)
      setPendingInvites(invites)
    } catch (error) {
      console.error("Failed to load social data", error)
      toast.error("Failed to load social data")
    }
  }

  useEffect(() => {
    const boot = async () => {
      try {
        const activeSession = await getSession()
        if (!activeSession) {
          router.push("/login")
          return
        }

        setSession(activeSession)
        await refreshSocialData()
      } catch (error) {
        console.error("Failed to load session", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    void boot()
  }, [router])

  const myClubIds = new Set((data?.myClubs ?? []).map((club) => club.id))
  const followingIds = new Set(data?.followingUserIds ?? [])

  async function handleFollow(username: string, currentlyFollowing: boolean) {
    setPendingUser(username)
    try {
      if (currentlyFollowing) {
        await unfollowUserByUsername(username)
        toast.success(`Unfollowed @${username}`)
      } else {
        await followUserByUsername(username)
        toast.success(`Now following @${username}`)
      }
      await refreshSocialData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setPendingUser(null)
    }
  }

  async function handleCreateClub() {
    if (!clubName.trim()) {
      toast.error("Enter a club name")
      return
    }

    setCreatingClub(true)
    try {
      await createBookClub({ name: clubName, description: clubDescription })
      setClubName("")
      setClubDescription("")
      toast.success("Book club created")
      await refreshSocialData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create club")
    } finally {
      setCreatingClub(false)
    }
  }

  async function handleClubMembership(clubId: string, joined: boolean) {
    setPendingClub(clubId)
    try {
      if (joined) {
        await leaveBookClub(clubId)
        toast.success("Left book club")
      } else {
        await joinBookClub(clubId)
        toast.success("Joined book club")
      }
      await refreshSocialData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update membership")
    } finally {
      setPendingClub(null)
    }
  }

  async function handleInviteResponse(inviteId: string, accept: boolean) {
    setPendingInviteAction(inviteId)
    try {
      await respondToClubInvite(inviteId, accept)
      toast.success(accept ? "Joined club" : "Declined invite")
      await refreshSocialData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to respond to invite")
    } finally {
      setPendingInviteAction(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background p-6 lg:p-10">
        <section className="mx-auto max-w-6xl">
          <p className="text-sm text-muted-foreground">Loading social hub...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <Users className="size-3.5" />
              Social
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Social reading hub</h1>
            <p className="text-muted-foreground">
              Follow readers, explore public profiles, and join collaborative book clubs.
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
            <ProfileMenu
              name={session?.user?.name ?? ""}
              email={session?.user?.email ?? ""}
              image={session?.user?.image}
              isAdmin={session?.user?.role === "admin"}
              username={session?.user?.username}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Following</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{data?.followingCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{data?.followersCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{data?.myClubs.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Discover readers</CardTitle>
              <CardDescription>Follow public profiles to see what they are reading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.discoverableUsers.length ? (
                data.discoverableUsers.map((user) => {
                  const isFollowing = followingIds.has(user.id)
                  const profileUsername = user.username
                  if (!profileUsername) {
                    return null
                  }
                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{user.name || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/u/${user.username}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                          View
                        </Link>
                        <Button
                          size="sm"
                          variant={isFollowing ? "outline" : "default"}
                          disabled={pendingUser === profileUsername}
                          onClick={() => void handleFollow(profileUsername, isFollowing)}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No public profiles available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create book club</CardTitle>
              <CardDescription>Start a shared shelf with friends and readers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={clubName}
                onChange={(event) => setClubName(event.target.value)}
                placeholder="Club name"
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
              <textarea
                value={clubDescription}
                onChange={(event) => setClubDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button className="gap-2" disabled={creatingClub} onClick={() => void handleCreateClub()}>
                <Plus className="size-4" />
                {creatingClub ? "Creating..." : "Create club"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Following feed</CardTitle>
            <CardDescription>Recent updates from readers you follow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.feed.length ? (
              data.feed.map((item) => (
                <div key={`${item.book.id}-${item.book.updatedAt}`} className="rounded-md border border-border/70 px-3 py-2">
                  <p className="text-sm font-medium">
                    {item.owner?.username ? (
                      <Link href={`/u/${item.owner.username}`} className="hover:underline">
                        @{item.owner.username}
                      </Link>
                    ) : (
                      "A reader"
                    )}{" "}
                    updated <span className="italic">{item.book.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.book.author}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Follow people to build your activity feed.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Book clubs</CardTitle>
            <CardDescription>Join public clubs and collaborate on shared reading lists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.publicClubs.length ? (
              data.publicClubs.map((club) => {
                const joined = myClubIds.has(club.id)
                return (
                  <div key={club.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                    <div>
                      <Link href={`/clubs/${club.id}`} className="text-sm font-medium hover:underline">
                        {club.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{club.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/clubs/${club.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Open
                      </Link>
                      <Button
                        size="sm"
                        variant={joined ? "outline" : "default"}
                        disabled={pendingClub === club.id}
                        onClick={() => void handleClubMembership(club.id, joined)}
                      >
                        {joined ? "Leave" : "Join"}
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No clubs yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Accept or decline invites from club moderators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invites.</p>
            ) : (
              pendingInvites.map((invite) => (
                <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{invite.club?.name ?? "Book club"}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited by @{invite.inviter?.username ?? invite.inviter?.email ?? "unknown"} as {invite.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingInviteAction === invite.id}
                      onClick={() => void handleInviteResponse(invite.id, false)}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      disabled={pendingInviteAction === invite.id}
                      onClick={() => void handleInviteResponse(invite.id, true)}
                    >
                      Accept
                    </Button>
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

