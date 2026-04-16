"use server"

import { auth } from "@/src/lib/auth"

export type PasswordResetActionState = {
  ok: boolean
  message: string
}

const genericRequestResponse: PasswordResetActionState = {
  ok: true,
  message: "If an account exists for this email, a password reset link has been sent.",
}

export async function requestPasswordResetAction(
  _prevState: PasswordResetActionState,
  formData: FormData
): Promise<PasswordResetActionState> {
  try {
    void _prevState
    const email = String(formData.get("email") ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return { ok: false, message: "Enter a valid email address." }
    }

    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: "/reset-password",
      },
    })

    return genericRequestResponse
  } catch (error) {
    console.error("Error requesting password reset:", error)
    // Keep this generic to avoid account enumeration.
    return genericRequestResponse
  }
}

export async function resetPasswordAction(
  _prevState: PasswordResetActionState,
  formData: FormData
): Promise<PasswordResetActionState> {
  try {
    void _prevState
    const token = String(formData.get("token") ?? "").trim()
    const newPassword = String(formData.get("newPassword") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (!token) {
      return { ok: false, message: "Missing or invalid reset token." }
    }

    if (newPassword.length < 8) {
      return { ok: false, message: "Password must be at least 8 characters." }
    }

    if (newPassword !== confirmPassword) {
      return { ok: false, message: "Passwords do not match." }
    }

    await auth.api.resetPassword({
      body: {
        token,
        newPassword,
      },
    })

    return { ok: true, message: "Password updated. You can now log in with your new password." }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { ok: false, message: "Password reset failed. Request a new link and try again." }
  }
}

