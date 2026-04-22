import { eq } from "drizzle-orm"

import PageHeader from "@/src/components/layout/page-header"
import SettingsPanel, { type SettingsPanelProps } from "@/src/components/settings/settings-panel"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { db } from "@/src/db"
import { accountsTable } from "@/src/db/schema/user"
import { requireAuthenticatedUser } from "@/src/lib/admin"
import { getEnabledAuthProviders } from "@/src/lib/auth-providers"

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
        <PageHeader
          title="Account settings"
          description={`Manage your account settings for ${session.user.email}.`}
          breadcrumbCurrentLabel="Settings"
          actions={<NotificationsButton />}
        />

        <SettingsPanel {...settingsPanelProps} />
      </section>
    </main>
  )
}
