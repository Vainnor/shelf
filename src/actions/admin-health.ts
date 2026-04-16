"use server"

import { auth } from "@/src/lib/auth"
import { requireAdminUser } from "@/src/lib/admin"
import { writeAuditLog } from "@/src/lib/audit"
import { getEmailDiagnostics } from "@/src/lib/email"

export type EmailDiagnosticsActionState = {
  ok: boolean
  message: string
}

export async function sendAdminTestResetEmailAction(
  _prevState: EmailDiagnosticsActionState,
  _formData: FormData
): Promise<EmailDiagnosticsActionState> {
  try {
    void _prevState
    void _formData

    const { user } = await requireAdminUser()
    const diagnostics = getEmailDiagnostics()

    if (!diagnostics.configured) {
      return {
        ok: false,
        message: `Email transport is not configured. Missing: ${diagnostics.missing.join(", ")}.`,
      }
    }

    await auth.api.requestPasswordReset({
      body: {
        email: user.email,
        redirectTo: "/reset-password",
      },
    })

    await writeAuditLog({
      actorUserId: user.id,
      scope: "admin",
      action: "system.email_diagnostics_test_reset_requested",
      targetType: "user",
      targetId: user.id,
      metadata: {
        email: user.email,
      },
    })

    return {
      ok: true,
      message: `Test reset email requested for ${user.email}. Check inbox/spam and your configured provider logs.`,
    }
  } catch (error) {
    console.error("Failed to send admin test reset email:", error)
    return {
      ok: false,
      message: "Failed to request test reset email. Check server logs and email transport configuration.",
    }
  }
}

