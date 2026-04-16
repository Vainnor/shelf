import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import SettingsPanel from "@/src/components/settings/settings-panel"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { requireAuthenticatedUser } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

export default async function SettingsPage() {
  const { session, user } = await requireAuthenticatedUser()

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit">Settings</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
            <p className="text-muted-foreground">Manage your account settings for {session.user.email}.</p>
          </div>

          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <SettingsPanel
          initialName={user.name ?? ""}
          initialEmail={user.email}
          initialUsername={user.username ?? ""}
          initialPublicProfileEnabled={user.publicProfileEnabled}
          initialReadingReminderEnabled={user.readingReminderEnabled}
          initialReadingReminderChannel={user.readingReminderChannel}
          initialReadingReminderDays={user.readingReminderDays}
          userId={user.id}
          role={user.role}
        />
      </section>
    </main>
  )
}

