import { headers } from "next/headers"
import { redirect } from "next/navigation"

import AuthForm from "@/src/components/auth/auth-form"
import { auth } from "@/src/lib/auth"
import { getEnabledAuthProviders } from "@/src/lib/auth-providers"

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  const providers = getEnabledAuthProviders()

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <AuthForm mode="login" providers={providers} />
    </main>
  )
}

