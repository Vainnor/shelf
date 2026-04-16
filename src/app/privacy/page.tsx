import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

export const metadata: Metadata = {
  title: "Privacy Policy | Shelf",
  description: "How Shelf handles account, reading, and operational data.",
}

const sections = [
  {
    title: "Data we collect",
    body: "Shelf stores account details (name, email, auth metadata) and reading data you add such as books, progress notes, and preferences.",
  },
  {
    title: "How we use data",
    body: "We use your data to provide core features like authentication, dashboard analytics, reminders, recommendations, and account security flows.",
  },
  {
    title: "Sharing and disclosure",
    body: "Shelf does not sell your personal data. Data may be processed by infrastructure and email providers required to run authentication and operational notifications.",
  },
  {
    title: "Data retention and deletion",
    body: "You can export your data from settings and request account deletion. Deletion removes your account and associated records from this deployment.",
  },
  {
    title: "Security",
    body: "We use authenticated sessions, role-based access controls, and audit logs for critical administrative operations.",
  },
  {
    title: "Contact",
    body: "For questions about this policy, contact your Shelf deployment administrator.",
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit gap-1.5">
              <ShieldCheck className="size-3.5" />
              Legal
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
            <p className="text-muted-foreground">Last updated: April 15, 2026</p>
          </div>

          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Shelf handles your data</CardTitle>
            <CardDescription>
              This policy is a baseline template. Customize for your deployment and legal requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <h2 className="text-base font-medium">{section.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

