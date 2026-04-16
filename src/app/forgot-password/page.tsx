"use client"

import Link from "next/link"
import { useActionState } from "react"

import {
  requestPasswordResetAction,
  type PasswordResetActionState,
} from "@/src/actions/password-reset"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

const initialState: PasswordResetActionState = {
  ok: false,
  message: "",
}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState)

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email and we will send a reset link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={action} className="space-y-3">
            <Input name="email" type="email" placeholder="you@example.com" required disabled={pending} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          {state.message ? (
            <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>{state.message}</p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
