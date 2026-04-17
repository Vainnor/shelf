"use server"

import { headers } from "next/headers"

import { writeAuditLog } from "@/src/lib/audit"
import { getEnabledAuthProviders } from "@/src/lib/auth-providers"
import { auth } from "@/src/lib/auth"
import { requireAuthenticatedUser } from "@/src/lib/admin"

export async function startSocialAccountLink(providerId: string) {
  const { user } = await requireAuthenticatedUser()

  const provider = getEnabledAuthProviders().find(
    (candidate) => candidate.kind === "social" && candidate.id === providerId
  )

  if (!provider) {
    throw new Error("Provider is not enabled for this instance")
  }

  const requestHeaders = await headers()
  const result = await auth.api.linkSocialAccount({
    headers: requestHeaders,
    body: {
      provider: provider.id as never,
      callbackURL: "/settings",
      errorCallbackURL: "/settings",
      disableRedirect: true,
    },
  })

  const url = (result as { url?: string } | null)?.url
  if (!url) {
    throw new Error("Failed to start provider linking")
  }

  await writeAuditLog({
    actorUserId: user.id,
    scope: "social",
    action: "auth.provider_link_requested",
    targetType: "user",
    targetId: user.id,
    metadata: {
      providerId: provider.id,
    },
  })

  return {
    ok: true,
    url,
  }
}

