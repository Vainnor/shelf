import { createAuthClient } from "better-auth/react"
import { genericOAuthClient } from "better-auth/client/plugins"

const fallbackOrigin = "http://localhost:8080"

function resolveOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin
  }

  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_AUTH_URL ??
    fallbackOrigin
  )
}

function toAuthBaseUrl(value: string) {
  if (!/^https?:\/\//i.test(value)) {
    return `${fallbackOrigin}/api/auth`
  }

  const url = new URL(value)
  url.pathname = "/api/auth"
  url.search = ""
  url.hash = ""

  return url.toString().replace(/\/$/, "")
}

const authBaseUrl = toAuthBaseUrl(resolveOrigin())

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  plugins: [genericOAuthClient()],
})

