import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth } from "better-auth/plugins"
import { eq } from "drizzle-orm"

import { db, schema } from "@/src/db"
import { usersTable } from "@/src/db/schema/user"
import {
  getCustomOAuthProvidersConfig,
  getEnabledSocialProvidersConfig,
} from "@/src/lib/auth-providers"
import { sendPasswordResetEmail } from "@/src/lib/email"

const socialProviders = getEnabledSocialProvidersConfig()
const customOAuthProviders = getCustomOAuthProvidersConfig()

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "shelf-development-secret-change-me",
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? user.email,
        resetUrl: url,
      })
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: false,
  }),
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const userId = String(session.userId)
          const user = await db.query.user.findFirst({
            where: eq(usersTable.id, userId),
          })

          if (!user || user.isDisabled) {
            return false
          }
        },
      },
    },
  },
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
