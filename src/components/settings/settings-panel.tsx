"use client"

import { Download, KeyRound, TriangleAlert, Trash2 } from "lucide-react"
import { type FormEvent, useActionState, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  deleteCurrentUserAccount,
  exportCurrentUserData,
  sendCurrentUserPasswordReset,
  updateReadingReminderSettings,
  updateCurrentUserSettings,
} from "@/src/actions/settings"
import { startSocialAccountLink } from "@/src/actions/auth-connections"
import { updatePublicProfileSettings } from "@/src/actions/social"
import type { SettingsActionState } from "@/src/actions/settings"
import { authClient } from "@/src/lib/auth-client"
import type { AuthProviderOption } from "@/src/lib/auth-providers"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import type { UserRole } from "@/src/db/schema/user"

export type SettingsPanelProps = {
  initialName: string
  initialEmail: string
  initialUsername: string
  initialPublicProfileEnabled: boolean
  initialPublicShowHighlights: boolean
  initialPublicHighlightsLimit: number
  initialReadingReminderEnabled: boolean
  initialReadingReminderChannel: string
  initialReadingReminderDays: number
  availableAuthProviders: AuthProviderOption[]
  linkedProviderIds: string[]
  userId: string
  role: UserRole
}

const initialSettingsActionState: SettingsActionState = {
  ok: false,
  message: "",
}

export default function SettingsPanel({
  initialName,
  initialEmail,
  initialUsername,
  initialPublicProfileEnabled,
  initialPublicShowHighlights,
  initialPublicHighlightsLimit,
  initialReadingReminderEnabled,
  initialReadingReminderChannel,
  initialReadingReminderDays,
  availableAuthProviders,
  linkedProviderIds,
  userId,
  role,
}: SettingsPanelProps) {
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
  const [reminderState, reminderAction, reminderPending] = useActionState(
    updateReadingReminderSettings,
    initialSettingsActionState
  )

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [username, setUsername] = useState(initialUsername)
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(initialPublicProfileEnabled)
  const [publicShowHighlights, setPublicShowHighlights] = useState(initialPublicShowHighlights)
  const [publicHighlightsLimit, setPublicHighlightsLimit] = useState(String(initialPublicHighlightsLimit))
  const [readingReminderEnabled, setReadingReminderEnabled] = useState(initialReadingReminderEnabled)
  const [readingReminderChannel, setReadingReminderChannel] = useState(initialReadingReminderChannel)
  const [readingReminderDays, setReadingReminderDays] = useState(String(initialReadingReminderDays))
  const [socialPending, setSocialPending] = useState(false)
  const [linkingProviderId, setLinkingProviderId] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState("")

  const connectedProviderIds = useMemo(() => new Set(linkedProviderIds), [linkedProviderIds])
  const connectableProviders = useMemo(() => availableAuthProviders, [availableAuthProviders])

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

  useEffect(() => {
    if (!reminderState.message) {
      return
    }

    if (reminderState.ok) {
      toast.success(reminderState.message)
      return
    }

    toast.error(reminderState.message)
  }, [reminderState])

  async function handleSocialSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSocialPending(true)
    try {
      const updated = await updatePublicProfileSettings({
        username,
        publicProfileEnabled,
        publicShowHighlights,
        publicHighlightsLimit: Number(publicHighlightsLimit || 0),
      })

      setUsername(updated.username ?? "")
      setPublicProfileEnabled(updated.publicProfileEnabled)
      setPublicShowHighlights(updated.publicShowHighlights)
      setPublicHighlightsLimit(String(updated.publicHighlightsLimit))
      toast.success("Public profile settings updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update social settings")
    } finally {
      setSocialPending(false)
    }
  }

  async function handleProviderLink(providerId: string) {
    setLinkingProviderId(providerId)
    try {
      const result = await startSocialAccountLink(providerId)
      if (!result.url) {
        throw new Error("Provider did not return a redirect URL")
      }
      window.location.href = result.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start provider link")
      setLinkingProviderId(null)
    }
  }

  async function handleOauthProviderLink(providerId: string) {
    setLinkingProviderId(providerId)
    try {
      const result = await authClient.signIn.oauth2({
        providerId,
        callbackURL: "/settings",
        errorCallbackURL: "/settings",
      })

      if (result?.error) {
        throw new Error(result.error.message ?? "Provider linking failed")
      }

      const redirectUrl =
        result?.data && typeof result.data === "object" && "url" in result.data
          ? result.data.url
          : undefined

      if (typeof redirectUrl === "string" && redirectUrl.length > 0) {
        window.location.href = redirectUrl
        return
      }

      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start provider link")
      setLinkingProviderId(null)
    }
  }

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
          <CardTitle>Reading reminders</CardTitle>
          <CardDescription>
            Get notified when books in your reading shelf have not been updated for a while.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={reminderAction} className="space-y-3">
            <input type="hidden" name="readingReminderEnabled" value={readingReminderEnabled ? "true" : "false"} />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={readingReminderEnabled}
                onChange={(event) => setReadingReminderEnabled(event.target.checked)}
                disabled={reminderPending}
                className="size-4"
              />
              Enable reading reminders
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Channel</span>
                <select
                  name="readingReminderChannel"
                  value={readingReminderChannel}
                  onChange={(event) => setReadingReminderChannel(event.target.value)}
                  disabled={reminderPending || !readingReminderEnabled}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="push">Push</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">Notify after inactivity (days)</span>
                <Input
                  name="readingReminderDays"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={readingReminderDays}
                  onChange={(event) => setReadingReminderDays(event.target.value)}
                  disabled={reminderPending || !readingReminderEnabled}
                />
              </label>
            </div>

            <Button type="submit" disabled={reminderPending}>
              {reminderPending ? "Saving..." : "Save reminder settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>
            Opt in to a shareable profile and choose your public username.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSocialSettingsSubmit} className="space-y-4">
            <div className="space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Username</span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  placeholder="reader_name"
                  required
                  disabled={socialPending}
                />
              </label>

              <div className="space-y-3 border-t border-border/60 pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={publicProfileEnabled}
                    onChange={(event) => setPublicProfileEnabled(event.target.checked)}
                    disabled={socialPending}
                    className="size-4"
                  />
                  Enable shareable public profile
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={publicShowHighlights}
                    onChange={(event) => setPublicShowHighlights(event.target.checked)}
                    disabled={socialPending || !publicProfileEnabled}
                    className="size-4"
                  />
                  Show recent highlights on public profile
                </label>

                <label className="block max-w-xs space-y-1 text-sm">
                  <span className="font-medium">Highlights to show</span>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={publicHighlightsLimit}
                    onChange={(event) => setPublicHighlightsLimit(event.target.value)}
                    disabled={socialPending || !publicProfileEnabled || !publicShowHighlights}
                  />
                </label>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Public profile URL:{" "}
              <span className="font-mono text-foreground/90">
                {username ? `/u/${username}` : "Set a username to generate a profile URL."}
              </span>
            </div>

            <Button type="submit" disabled={socialPending}>
              {socialPending ? "Saving..." : "Save public profile settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected sign-in providers</CardTitle>
          <CardDescription>
            Link social sign-in accounts to this profile so you can use any connected provider to log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connectableProviders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No external sign-in providers are enabled on this instance.</p>
          ) : (
            connectableProviders.map((provider) => {
              const connected = connectedProviderIds.has(provider.id)
              const linkingThisProvider = linkingProviderId === provider.id

              return (
                <div
                  key={`${provider.kind}:${provider.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{provider.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {connected ? "Connected" : "Not connected"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={connected ? "secondary" : "outline"}
                    disabled={connected || Boolean(linkingProviderId)}
                    onClick={() => {
                      if (provider.kind === "social") {
                        void handleProviderLink(provider.id)
                        return
                      }
                      void handleOauthProviderLink(provider.id)
                    }}
                  >
                    {connected ? "Connected" : linkingThisProvider ? "Opening..." : "Connect"}
                  </Button>
                </div>
              )
            })
          )}
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

