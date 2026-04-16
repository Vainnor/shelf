"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import {
  getClubPageData,
  inviteUserToClub,
  removeClubMember,
  revokeClubInvite,
  updateClubMemberRole,
} from "@/src/actions/clubs"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

export default function ClubModerationPage() {
  const params = useParams<{ id: string }>()
  const clubId = params.id

  const [data, setData] = useState<Awaited<ReturnType<typeof getClubPageData>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [inviteUsername, setInviteUsername] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "moderator">("member")

  const loadData = useCallback(async () => {
    try {
      setData(await getClubPageData(clubId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load moderation")
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const canModerate = data?.viewerMembership.role === "owner" || data?.viewerMembership.role === "moderator"

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>Loading moderation tools...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  async function handleInvite() {
    if (!inviteUsername.trim()) {
      toast.error("Username is required")
      return
    }

    setPendingAction("invite")
    try {
      await inviteUserToClub({ clubId, username: inviteUsername, role: inviteRole })
      setInviteUsername("")
      toast.success("Invite sent")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setPendingAction(`revoke-${inviteId}`)
    try {
      await revokeClubInvite(clubId, inviteId)
      toast.success("Invite revoked")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke invite")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRoleChange(userId: string, role: "member" | "moderator") {
    setPendingAction(`role-${userId}`)
    try {
      await updateClubMemberRole(clubId, userId, role)
      toast.success("Role updated")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role")
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRemoveMember(userId: string) {
    setPendingAction(`remove-${userId}`)
    try {
      await removeClubMember(clubId, userId)
      toast.success("Member removed")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    } finally {
      setPendingAction(null)
    }
  }

  if (!canModerate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>This section is available to moderators and owners only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/clubs/${clubId}/members`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Go to members
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>Invite readers by username and assign role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              value={inviteUsername}
              onChange={(event) => setInviteUsername(event.target.value)}
              placeholder="username"
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as "member" | "moderator")}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="member">member</option>
              <option value="moderator">moderator</option>
            </select>
          </div>
          <Button onClick={() => void handleInvite()} disabled={pendingAction === "invite"}>
            Send invite
          </Button>

          <div className="space-y-2 pt-2">
            {data?.invites.length ? (
              data.invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">@{invite.invitedUser?.username ?? invite.invitedUser?.email}</p>
                    <p className="text-xs text-muted-foreground">Role: {invite.role}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingAction === `revoke-${invite.id}`}
                    onClick={() => void handleRevokeInvite(invite.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No pending invites.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member management</CardTitle>
          <CardDescription>Promote, demote, or remove members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data?.members.map((member) => {
            const isOwner = member.role === "owner"
            return (
              <div key={member.id} className="rounded-md border border-border/70 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{member.user?.name || member.user?.username || member.user?.email}</p>
                    <p className="text-xs text-muted-foreground">@{member.user?.username ?? member.user?.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isOwner || pendingAction === `role-${member.userId}`}
                    onClick={() => void handleRoleChange(member.userId, member.role === "moderator" ? "member" : "moderator")}
                  >
                    {member.role === "moderator" ? "Set member" : "Set moderator"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isOwner || pendingAction === `remove-${member.userId}`}
                    onClick={() => void handleRemoveMember(member.userId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

