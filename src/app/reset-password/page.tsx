"use client"

import Link from "next/link"
import { Suspense, useActionState } from "react"
import { useSearchParams } from "next/navigation"

import { resetPasswordAction, type PasswordResetActionState } from "@/src/actions/password-reset"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

const initialState: PasswordResetActionState = {
  ok: false,
  message: "",
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [state, action, pending] = useActionState(resetPasswordAction, initialState)

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <p className="text-sm text-destructive">
              Missing reset token. Request a new link from the forgot password page.
            </p>
          ) : (
            <form action={action} className="space-y-3">
              <input type="hidden" name="token" value={token} />
              <Input
                name="newPassword"
                type="password"
                minLength={8}
                placeholder="New password"
                required
                disabled={pending}
              />
              <Input
                name="confirmPassword"
                type="password"
                minLength={8}
                placeholder="Confirm new password"
                required
                disabled={pending}
              />
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}

          {state.message ? (
            <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>{state.message}</p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

function ResetPasswordPageFallback() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Loading reset link...</CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}

