"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/src/components/ui/button"
import { authClient } from "@/src/lib/auth-client"

export default function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut()
      router.push("/login")
      router.refresh()
    })
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={isPending}>
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  )
}

