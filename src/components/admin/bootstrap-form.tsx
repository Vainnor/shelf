"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { createInitialAdmin } from "@/src/actions/admin-bootstrap"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

export function BootstrapForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formElement = event.currentTarget
    const formData = new FormData(formElement)

    startTransition(async () => {
      try {
        await createInitialAdmin(formData)
        router.push("/login")
        router.refresh()
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Failed to create admin")
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Initialize system admin</CardTitle>
        <CardDescription>
          This setup page is available only once. Create the first admin account for this deployment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="name" placeholder="Admin name" required disabled={isPending} />
          <Input name="email" type="email" placeholder="Admin email" required disabled={isPending} />
          <Input
            name="password"
            type="password"
            placeholder="Password (min 8 characters)"
            minLength={8}
            required
            disabled={isPending}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating admin..." : "Create admin account"}
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}

