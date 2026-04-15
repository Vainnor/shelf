import { ArrowLeft, Cog, Shield, UserRound } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { auth } from "@/src/lib/auth"
import { cn } from "@/src/lib/utils"

const settingsSections = [
  {
    icon: UserRound,
    title: "Profile preferences",
    description: "Display name and profile customization options.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Password, provider linking, and session management controls.",
  },
  {
    icon: Cog,
    title: "Application",
    description: "Reading defaults and dashboard behavior settings.",
  },
]

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit">Settings</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Account settings</h1>
            <p className="text-muted-foreground">
              Settings are currently scaffolded for {session.user.email}.
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

        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="size-4" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Coming soon: configuration controls for this section.
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}

