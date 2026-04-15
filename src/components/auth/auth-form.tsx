"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { signUpWithEmail } from "@/src/actions/auth"
import { authClient } from "@/src/lib/auth-client"
import type { AuthProviderOption } from "@/src/lib/auth-providers"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

type AuthMode = "login" | "signup"

type AuthFormProps = {
  mode: AuthMode
  providers: AuthProviderOption[]
  allowSignupLink?: boolean
}

export default function AuthForm({ mode, providers, allowSignupLink = true }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const title = mode === "signup" ? "Create your account" : "Welcome back"
  const description =
    mode === "signup"
      ? "Sign up with email and password or use a provider."
      : "Log in with your password or continue with a provider."

  async function handlePasswordAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      if (mode === "signup") {
        try {
          await signUpWithEmail({ name, email, password })
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Authentication failed")
          return
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        })

        if (result?.error) {
          setError(result.error.message ?? "Authentication failed")
          return
        }
      }

      router.push("/dashboard")
      router.refresh()
    })
  }

  async function handleProviderAuth(provider: AuthProviderOption) {
    setError(null)

    startTransition(async () => {
      const client = authClient
      const result =
        provider.kind === "social"
          ? await client.signIn.social({
              provider: provider.id,
              callbackURL: "/dashboard",
              errorCallbackURL: mode === "signup" ? "/signup" : "/login",
            })
          : await client.signIn.oauth2({
              providerId: provider.id,
              callbackURL: "/dashboard",
              errorCallbackURL: mode === "signup" ? "/signup" : "/login",
            })

      if (result?.error) {
        setError(result.error.message ?? "Provider sign in failed")
        return
      }

      const redirectUrl =
        result?.data && typeof result.data === "object" && "url" in result.data
          ? result.data.url
          : undefined

      if (typeof redirectUrl === "string" && redirectUrl.length > 0) {
        window.location.href = redirectUrl
        return
      }

      router.refresh()
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handlePasswordAuth}>
          {mode === "signup" ? (
            <Input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={isPending}
            />
          ) : null}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isPending}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            disabled={isPending}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {mode === "signup" ? "Sign up with email" : "Log in with email"}
          </Button>
        </form>

        {providers.length > 0 ? (
          <div className="space-y-2">
            {providers.map((provider) => (
              <Button
                key={`${provider.kind}:${provider.id}`}
                variant="outline"
                className="w-full"
                onClick={() => handleProviderAuth(provider)}
                disabled={isPending}
              >
                Continue with {provider.label}
              </Button>
            ))}
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <p className="text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
          {mode === "signup" || allowSignupLink ? (
            <Link
              href={mode === "signup" ? "/login" : "/signup"}
              className="underline underline-offset-4"
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </Link>
          ) : (
            <span className="text-foreground">Signups are disabled</span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}


