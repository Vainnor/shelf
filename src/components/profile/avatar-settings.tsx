"use client"

import { ImageIcon, Trash2 } from "lucide-react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { ProfileActionState } from "@/src/actions/profile"
import { clearCurrentUserAvatar, updateCurrentUserAvatarUrl } from "@/src/actions/profile"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

type AvatarSettingsProps = {
  name: string | null
  email: string
  currentImage: string | null
}

const initialActionState: ProfileActionState = {
  ok: false,
  message: "",
}

function getInitials(name: string | null, email: string) {
  const value = (name?.trim() || email.trim() || "User").split(/\s+/).filter(Boolean)
  if (value.length === 1) {
    return value[0].slice(0, 2).toUpperCase()
  }
  return `${value[0]?.[0] ?? "U"}${value[1]?.[0] ?? ""}`.toUpperCase()
}

export default function AvatarSettings({ name, email, currentImage }: AvatarSettingsProps) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCurrentUserAvatarUrl,
    initialActionState
  )
  const [clearState, clearAction, clearPending] = useActionState(
    clearCurrentUserAvatar,
    initialActionState
  )
  const [avatarUrl, setAvatarUrl] = useState(currentImage ?? "")

  useEffect(() => {
    if (!updateState.message) {
      return
    }

    if (updateState.ok) {
      toast.success(updateState.message)
      return
    }

    toast.error(updateState.message)
  }, [updateState])

  useEffect(() => {
    if (!clearState.message) {
      return
    }

    if (clearState.ok) {
      setAvatarUrl("")
      toast.success(clearState.message)
      return
    }

    toast.error(clearState.message)
  }, [clearState])

  const initials = useMemo(() => getInitials(name, email), [email, name])
  const displayImage = avatarUrl.trim() || currentImage || ""

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-4" />
          Avatar
        </CardTitle>
        <CardDescription>
          Add an avatar URL to personalize your account. Supported: public http(s) image URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile avatar"
              className="size-16 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="inline-flex size-16 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold uppercase">
              {initials}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            This avatar appears on your account profile.
          </div>
        </div>

        <form action={updateAction} className="space-y-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Avatar URL</span>
            <Input
              name="imageUrl"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              disabled={updatePending}
            />
          </label>
          <Button type="submit" className="mt-4" disabled={updatePending}>
            {updatePending ? "Saving..." : "Save avatar"}
          </Button>
        </form>

        <form action={clearAction}>
          <Button type="submit" variant="outline" disabled={clearPending}>
            <Trash2 className="size-4" />
            {clearPending ? "Removing..." : "Remove avatar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

