import { createAuthClient } from "better-auth/react"
import { genericOAuthClient } from "better-auth/client/plugins"

const fallbackOrigin = "http://localhost:3000"
const configuredOrigin =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_AUTH_URL ??
  fallbackOrigin

function toAuthBaseUrl(value: string) {
  if (!value.startsWith("http")) {
    return `${fallbackOrigin}/api/auth`
  }

  const url = new URL(value)

  if (url.pathname === "/" || url.pathname.length === 0) {
    url.pathname = "/api/auth"
  }

  return url.toString().replace(/\/$/, "")
}

const authBaseUrl = toAuthBaseUrl(configuredOrigin)

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [genericOAuthClient()],
})

