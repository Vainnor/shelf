import type { Metadata } from "next"

import PageHeader from "@/src/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

export const metadata: Metadata = {
  title: "Terms | Shelf",
  description: "Terms of use for Shelf deployments.",
}

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Terms of use"
          description="Last updated: April 15, 2026"
          breadcrumbCurrentLabel="Terms"
          breadcrumbRootLabel="Home"
          breadcrumbRootHref="/"
        />

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
