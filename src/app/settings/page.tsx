import { ArrowLeft } from "lucide-react"
import { eq } from "drizzle-orm"
import Link from "next/link"

import SettingsPanel, { type SettingsPanelProps } from "@/src/components/settings/settings-panel"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { db } from "@/src/db"
import { accountsTable } from "@/src/db/schema/user"
import { requireAuthenticatedUser } from "@/src/lib/admin"
import { getEnabledAuthProviders } from "@/src/lib/auth-providers"
import { cn } from "@/src/lib/utils"

export default async function SettingsPage() {
  const { session, user } = await requireAuthenticatedUser()
  const providers = getEnabledAuthProviders()
  const linkedAccounts = await db.query.account.findMany({
    where: eq(accountsTable.userId, user.id),
  })
  const linkedProviderIds = Array.from(new Set(linkedAccounts.map((account) => account.providerId)))
  const settingsPanelProps: SettingsPanelProps = {
    initialName: user.name ?? "",
    initialEmail: user.email,
    initialUsername: user.username ?? "",
    initialPublicProfileEnabled: user.publicProfileEnabled,
    initialPublicShowHighlights: user.publicShowHighlights,
    initialPublicHighlightsLimit: user.publicHighlightsLimit,
    initialReadingReminderEnabled: user.readingReminderEnabled,
    initialReadingReminderChannel: user.readingReminderChannel,
    initialReadingReminderDays: user.readingReminderDays,
    availableAuthProviders: providers,
    linkedProviderIds,
    userId: user.id,
    role: user.role,
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit">Settings</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
            <p className="text-muted-foreground">Manage your account settings for {session.user.email}.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
            <NotificationsButton />
          </div>
        </div>

        <SettingsPanel {...settingsPanelProps} />
      </section>
    </main>
  )
}

