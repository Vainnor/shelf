import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpenText, ServerCog, ShieldCheck } from "lucide-react"

import DocsShell from "@/src/components/docs/docs-shell"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"
import { getSidebarGroups } from "@/src/lib/docs/content"

export const metadata: Metadata = {
  title: "Documentation",
  description: "Hosted usage guides and self-hosting runbooks for Shelf.",
}

export default function DocsPage() {
  const groups = getSidebarGroups()
  const hosted = groups.find((group) => group.audience === "hosted")
  const selfHost = groups.find((group) => group.audience === "self-host")

  return (
    <DocsShell
      title="Shelf Documentation"
      summary="Practical, route-specific guides for hosted users, hosted admins, and self-host operators."
      badgeLabel="Docs Home"
      sections={[
        { id: "tracks", title: "Documentation tracks", blocks: [] },
        { id: "quick-start", title: "Quick start paths", blocks: [] },
        { id: "operational-notes", title: "Operational notes", blocks: [] },
      ]}
    >
      <div className="space-y-8">
        <section id="tracks" className="scroll-mt-28 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Documentation tracks</h2>
            <p className="text-sm text-muted-foreground">
              Pick your operating context. Hosted guides focus on feature usage and admin controls. Self-host guides focus on deployment and operations.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpenText className="size-5 text-primary" />
                  Hosted Shelf
                </CardTitle>
                <CardDescription>
                  User workflows, account controls, notifications, and hosted admin operations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {hosted?.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <span className="text-muted-foreground">{item.title}</span>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ServerCog className="size-5 text-primary" />
                  Self-Hosting
                </CardTitle>
                <CardDescription>
                  Environment setup, migrations, backup/restore, worker operations, and hardening.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selfHost?.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <span className="text-muted-foreground">{item.title}</span>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="quick-start" className="scroll-mt-28 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Quick start paths</h2>
            <p className="text-sm text-muted-foreground">
              Jump directly into the most common first docs for each audience.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Hosted user onboarding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="w-fit">End user</Badge>
                <Link
                  href="/docs/hosted/getting-started"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
                >
                  Open guide
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Hosted admin operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="w-fit">Hosted admin</Badge>
                <Link
                  href="/docs/hosted/admin-operations"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
                >
                  Open guide
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Self-host deployment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="w-fit">Operator</Badge>
                <Link
                  href="/docs/self-host/overview-and-prerequisites"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
                >
                  Open guide
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="operational-notes" className="scroll-mt-28 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Operational notes</h2>
            <p className="text-sm text-muted-foreground">
              Confirm these baseline controls before broad user onboarding.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />
                Replace default secrets and set canonical auth URLs before production traffic.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />
                Validate `/admin/health` after deploys and before/after migration changes.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />
                Test backup restore regularly and require dry-run before destructive import operations.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </DocsShell>
  )
}
