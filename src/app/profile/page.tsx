import { ArrowLeft, Mail, UserRound } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { requireAuthenticatedUser } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

export default async function ProfilePage() {
  const { session } = await requireAuthenticatedUser()

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit">Profile</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
            <p className="text-muted-foreground">
              View and manage the core details for your Shelf account.
            </p>
          </div>

          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" />
              Account details
            </CardTitle>
            <CardDescription>
              This is your current authenticated identity information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Name:</span> {session.user.name ?? "Not set"}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span>
                <span className="font-medium">Email:</span> {session.user.email}
              </span>
            </p>
            <p>
              <span className="font-medium">User ID:</span> {session.user.id}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

