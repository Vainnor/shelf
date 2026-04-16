"use client"

import { useActionState } from "react"

import {
  sendAdminTestResetEmailAction,
  type EmailDiagnosticsActionState,
} from "@/src/actions/admin-health"
import type { EmailDiagnostics } from "@/src/lib/email"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

type EmailDiagnosticsCardProps = {
  diagnostics: EmailDiagnostics
  adminEmail: string
}

const initialState: EmailDiagnosticsActionState = {
  ok: false,
  message: "",
}

export default function EmailDiagnosticsCard({ diagnostics, adminEmail }: EmailDiagnosticsCardProps) {
  const [state, action, pending] = useActionState(sendAdminTestResetEmailAction, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email diagnostics</CardTitle>
        <CardDescription>
          Validate SES setup and send a test password-reset email to the current admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          <span className="font-medium">Status:</span> {diagnostics.configured ? "Configured" : "Missing config"}
        </p>
        <p>
          <span className="font-medium">Transport:</span> {diagnostics.transport}
        </p>
        <p>
          <span className="font-medium">Region:</span> {diagnostics.region ?? "Not set"}
        </p>
        <p>
          <span className="font-medium">SMTP host:</span> {diagnostics.smtpHost ?? "Not set"}
        </p>
        <p>
          <span className="font-medium">From email:</span> {diagnostics.fromEmail ?? "Not set"}
        </p>
        {!diagnostics.configured ? (
          <p className="text-destructive">Missing: {diagnostics.missing.join(", ")}</p>
        ) : null}
        <p className="text-muted-foreground">Test recipient: {adminEmail}</p>

        <form action={action}>
          <Button type="submit" disabled={pending || !diagnostics.configured}>
            {pending ? "Sending test..." : "Send test reset email"}
          </Button>
        </form>

        {state.message ? (
          <p className={state.ok ? "text-emerald-600" : "text-destructive"}>{state.message}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

