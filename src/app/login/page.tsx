import { redirect } from "next/navigation"

import AuthForm from "@/src/components/auth/auth-form"
import { getSystemSettings } from "@/src/lib/admin"
import { getEnabledAuthProviders } from "@/src/lib/auth-providers"
import { getActiveSession } from "@/src/lib/session"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const settings = await getSystemSettings()

  if (!settings.bootstrapCompleted) {
    redirect("/setup/admin")
  }

  const session = await getActiveSession()

  if (session) {
    redirect("/dashboard")
  }

  const providers = settings.signupsEnabled ? getEnabledAuthProviders() : []

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <AuthForm mode="login" providers={providers} allowSignupLink={settings.signupsEnabled} />
    </main>
  )
}

