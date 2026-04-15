import type { GenericOAuthConfig } from "better-auth/plugins"

type SocialProviderDefinition = {
  id: string
  label: string
  env: {
    clientId: string
    clientSecret: string
  }
}

type CustomOAuthProviderWithLabel = GenericOAuthConfig & {
  label?: string
}

export type AuthProviderOption = {
  id: string
  label: string
  kind: "social" | "oauth2"
}

const socialProviderDefinitions: SocialProviderDefinition[] = [
  {
    id: "google",
    label: "Google",
    env: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
  },
  {
    id: "github",
    label: "GitHub",
    env: { clientId: "GITHUB_CLIENT_ID", clientSecret: "GITHUB_CLIENT_SECRET" },
  },
  {
    id: "microsoft",
    label: "Microsoft",
    env: {
      clientId: "MICROSOFT_CLIENT_ID",
      clientSecret: "MICROSOFT_CLIENT_SECRET",
    },
  },
  {
    id: "discord",
    label: "Discord",
    env: { clientId: "DISCORD_CLIENT_ID", clientSecret: "DISCORD_CLIENT_SECRET" },
  },
  {
    id: "gitlab",
    label: "GitLab",
    env: { clientId: "GITLAB_CLIENT_ID", clientSecret: "GITLAB_CLIENT_SECRET" },
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    env: {
      clientId: "LINKEDIN_CLIENT_ID",
      clientSecret: "LINKEDIN_CLIENT_SECRET",
    },
  },
  {
    id: "apple",
    label: "Apple",
    env: { clientId: "APPLE_CLIENT_ID", clientSecret: "APPLE_CLIENT_SECRET" },
  },
  {
    id: "facebook",
    label: "Facebook",
    env: {
      clientId: "FACEBOOK_CLIENT_ID",
      clientSecret: "FACEBOOK_CLIENT_SECRET",
    },
  },
  {
    id: "twitter",
    label: "X / Twitter",
    env: { clientId: "TWITTER_CLIENT_ID", clientSecret: "TWITTER_CLIENT_SECRET" },
  },
  {
    id: "reddit",
    label: "Reddit",
    env: { clientId: "REDDIT_CLIENT_ID", clientSecret: "REDDIT_CLIENT_SECRET" },
  },
  {
    id: "spotify",
    label: "Spotify",
    env: { clientId: "SPOTIFY_CLIENT_ID", clientSecret: "SPOTIFY_CLIENT_SECRET" },
  },
  {
    id: "twitch",
    label: "Twitch",
    env: { clientId: "TWITCH_CLIENT_ID", clientSecret: "TWITCH_CLIENT_SECRET" },
  },
  {
    id: "slack",
    label: "Slack",
    env: { clientId: "SLACK_CLIENT_ID", clientSecret: "SLACK_CLIENT_SECRET" },
  },
  {
    id: "notion",
    label: "Notion",
    env: { clientId: "NOTION_CLIENT_ID", clientSecret: "NOTION_CLIENT_SECRET" },
  },
  {
    id: "tiktok",
    label: "TikTok",
    env: { clientId: "TIKTOK_CLIENT_ID", clientSecret: "TIKTOK_CLIENT_SECRET" },
  },
]

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim().length > 0)
}

export function getEnabledSocialProvidersConfig() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {}

  for (const provider of socialProviderDefinitions) {
    const clientId = process.env[provider.env.clientId]
    const clientSecret = process.env[provider.env.clientSecret]

    if (!hasValue(clientId) || !hasValue(clientSecret)) {
      continue
    }

    providers[provider.id] = {
      clientId,
      clientSecret,
    }
  }

  return providers
}

function formatProviderLabel(providerId: string) {
  return providerId
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function parseCustomOAuthProviders() {
  const raw = process.env.CUSTOM_OAUTH_PROVIDERS_JSON

  if (!hasValue(raw)) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is CustomOAuthProviderWithLabel => {
      if (!item || typeof item !== "object") {
        return false
      }

      const candidate = item as Partial<CustomOAuthProviderWithLabel>
      return hasValue(candidate.providerId) && hasValue(candidate.clientId)
    })
  } catch {
    return []
  }
}

export function getCustomOAuthProvidersConfig(): GenericOAuthConfig[] {
  return parseCustomOAuthProviders().map(({ label: _label, ...provider }) => provider)
}

export function getEnabledAuthProviders(): AuthProviderOption[] {
  const social = socialProviderDefinitions
    .filter((provider) => {
      const clientId = process.env[provider.env.clientId]
      const clientSecret = process.env[provider.env.clientSecret]
      return hasValue(clientId) && hasValue(clientSecret)
    })
    .map((provider) => ({
      id: provider.id,
      label: provider.label,
      kind: "social" as const,
    }))

  const custom = parseCustomOAuthProviders().map((provider) => ({
    id: provider.providerId,
    label: provider.label ?? formatProviderLabel(provider.providerId),
    kind: "oauth2" as const,
  }))

  return [...social, ...custom]
}

