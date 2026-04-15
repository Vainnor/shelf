import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth } from "better-auth/plugins"

import { db, schema } from "@/src/db"
import {
  getCustomOAuthProvidersConfig,
  getEnabledSocialProvidersConfig,
} from "@/src/lib/auth-providers"

const socialProviders = getEnabledSocialProvidersConfig()
const customOAuthProviders = getCustomOAuthProvidersConfig()

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "shelf-development-secret-change-me",
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: false,
  }),
  ...(Object.keys(socialProviders).length > 0
    ? { socialProviders: socialProviders as Record<string, unknown> }
    : {}),
  ...(customOAuthProviders.length > 0
    ? {
        plugins: [
          genericOAuth({
            config: customOAuthProviders,
          }),
        ],
      }
    : {}),
})
