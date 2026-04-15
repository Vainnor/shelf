"use client"

import { Download, KeyRound, TriangleAlert, Trash2 } from "lucide-react"
import { useActionState, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  deleteCurrentUserAccount,
  exportCurrentUserData,
  sendCurrentUserPasswordReset,
  updateCurrentUserSettings,
} from "@/src/actions/settings"
import type { SettingsActionState } from "@/src/actions/settings"
import { authClient } from "@/src/lib/auth-client"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

type SettingsPanelProps = {
  initialName: string
  initialEmail: string
  userId: string
  role: "user" | "admin"
}

const initialSettingsActionState: SettingsActionState = {
  ok: false,
  message: "",
}

export default function SettingsPanel({ initialName, initialEmail, userId, role }: SettingsPanelProps) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateCurrentUserSettings,
    initialSettingsActionState
  )
  const [passwordState, passwordAction, passwordPending] = useActionState(
    sendCurrentUserPasswordReset,
    initialSettingsActionState
  )
  const [exportState, exportAction, exportPending] = useActionState(
    exportCurrentUserData,
    initialSettingsActionState
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCurrentUserAccount,
    initialSettingsActionState
  )

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [confirmText, setConfirmText] = useState("")

  const fileName = useMemo(() => {
    const safeEmail = email.replace(/[^a-z0-9._-]/gi, "_")
    return `shelf-export-${safeEmail || userId}.json`
  }, [email, userId])

  useEffect(() => {
    if (!profileState.message) {
      return
    }

    if (profileState.ok) {
      toast.success(profileState.message)
      return
    }

    toast.error(profileState.message)
  }, [profileState])

  useEffect(() => {
    if (!passwordState.message) {
      return
    }

    if (passwordState.ok) {
      toast.success(passwordState.message)
      return
    }

    toast.error(passwordState.message)
  }, [passwordState])

  useEffect(() => {
    if (!exportState.message) {
      return
    }

    if (exportState.ok) {
      toast.success(exportState.message)
      return
    }

    toast.error(exportState.message)
  }, [exportState])

  useEffect(() => {
    if (!deleteState.message) {
      return
    }

    if (deleteState.ok) {
      toast.success(deleteState.message)
      return
    }

    toast.error(deleteState.message)
  }, [deleteState])

  useEffect(() => {
    if (deleteState.ok && deleteState.deleted) {
      void authClient.signOut().finally(() => {
        window.location.href = "/signup"
      })
    }
  }, [deleteState.deleted, deleteState.ok])

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Name</span>
                <Input
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  disabled={profilePending}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Email</span>
                <Input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={profilePending}
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={profilePending}>
                {profilePending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Security
          </CardTitle>
          <CardDescription>
            Send a password reset link to your current email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={passwordAction} className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="outline" disabled={passwordPending}>
              {passwordPending ? "Sending..." : "Send password reset email"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-4" />
            Data export
          </CardTitle>
          <CardDescription>
            Export your account and bookshelf data as JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={exportAction} className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="outline" disabled={exportPending}>
              {exportPending ? "Preparing export..." : "Generate JSON export"}
            </Button>
          </form>

          {exportState.dataJson ? (
            <div className="space-y-2">
              <textarea
                readOnly
                value={exportState.dataJson}
                className="h-56 w-full rounded-md border border-input bg-muted/30 p-3 font-mono text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const blob = new Blob([exportState.dataJson ?? ""], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const anchor = document.createElement("a")
                  anchor.href = url
                  anchor.download = fileName
                  anchor.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Download export file
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            This action cannot be undone. Type DELETE to confirm.
            {role === "admin" ? " Admin accounts cannot be removed if this is the last admin." : ""}
          </div>

          <form action={deleteAction} className="space-y-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Confirmation</span>
              <Input
                name="confirmText"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="Type DELETE"
                required
                disabled={deletePending}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Button type="submit" variant="destructive" disabled={deletePending}>
                <Trash2 className="size-4" />
                {deletePending ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

