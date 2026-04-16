import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Scale } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

export const metadata: Metadata = {
  title: "Terms | Shelf",
  description: "Terms of use for Shelf deployments.",
}

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit gap-1.5">
              <Scale className="size-3.5" />
              Legal
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Terms of use</h1>
            <p className="text-muted-foreground">Last updated: April 15, 2026</p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service terms</CardTitle>
            <CardDescription>
              This is a baseline template for self-hosted deployments. Update it to fit your legal requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You are responsible for account activity under your credentials.</p>
            <p>Do not use the service for unlawful, abusive, or harmful behavior.</p>
            <p>Availability and feature set may change without notice for maintenance or updates.</p>
            <p>For data handling details, review the Privacy policy.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

