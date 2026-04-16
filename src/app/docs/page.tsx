import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, BookText } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

export const metadata: Metadata = {
  title: "Docs | Shelf",
  description: "Quick docs links for Shelf users and self-hosted admins.",
}

const docsSections = [
  {
    title: "Getting started",
    items: ["Create an account", "Add books to your shelves", "Track progress and notes"],
  },
  {
    title: "Account tools",
    items: ["Export account data", "Reset password", "Configure reminders"],
  },
  {
    title: "Self-hosted admin",
    items: ["Review system health", "Use audit logs", "Run reminder worker"],
  },
]

export default function DocsPage() {
  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 w-fit gap-1.5">
              <BookText className="size-3.5" />
              Docs
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground">Quick references for using and operating Shelf.</p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {docsSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}

