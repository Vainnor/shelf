import Link from "next/link"
import { ArrowLeft, BookText, House } from "lucide-react"
import type { ReactNode } from "react"

import DocsBreadcrumbs from "@/src/components/docs/docs-breadcrumbs"
import DocsContentRenderer from "@/src/components/docs/docs-content-renderer"
import DocsOnThisPage from "@/src/components/docs/docs-on-this-page"
import DocsSidebar from "@/src/components/docs/docs-sidebar"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"
import {
  getDocBySlugValue,
  getPreviousNext,
  getSidebarGroups,
  type DocPage,
  type DocSection,
  type DocSlug,
} from "@/src/lib/docs/content"

type DocsShellProps = {
  title: string
  summary: string
  badgeLabel?: string
  currentSlug?: DocSlug | null
  sections?: DocSection[]
  children?: ReactNode
}

export default function DocsShell({
  title,
  summary,
  badgeLabel = "Docs",
  currentSlug = null,
  sections = [],
  children,
}: DocsShellProps) {
  const currentPage = currentSlug ? getDocBySlugValue(currentSlug) : null
  const groups = getSidebarGroups()
  const relatedPages: DocPage[] = currentPage
    ? currentPage.related
        .map((relatedSlug) => getDocBySlugValue(relatedSlug))
        .filter((page): page is DocPage => Boolean(page))
    : []

  const { previous, next } = currentPage
    ? getPreviousNext(currentPage.slug)
    : { previous: null, next: null }

  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-6 py-8 lg:px-8 lg:py-10">
      <div className="relative space-y-3 rounded-2xl border border-border/70 bg-linear-to-b from-background to-muted/20 p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size-[16px_16px]" />
        <div className="relative space-y-3">
          <DocsBreadcrumbs page={currentPage} />

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-4xl space-y-2">
              <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
                <BookText className="size-3.5" />
                {badgeLabel}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">{summary}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
                <House className="size-4" />
                Home
              </Link>
              <Link href="/docs" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
                <ArrowLeft className="size-4" />
                Docs index
              </Link>
            </div>
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-border/70 bg-card/80 p-3 md:hidden">
        <summary className="cursor-pointer text-sm font-medium">Browse documentation</summary>
        <div className="mt-3">
          <DocsSidebar groups={groups} currentSlug={currentSlug} compact />
        </div>
      </details>

      <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_260px]">
        <div className="hidden md:block">
          <DocsSidebar groups={groups} currentSlug={currentSlug} />
        </div>

        <Card className="border-border/70 bg-card/90">
          <CardContent className="space-y-8 px-5 py-5 sm:px-7 sm:py-7">
            {children ? children : <DocsContentRenderer sections={sections} />}
          </CardContent>
        </Card>

        <div className="hidden xl:block">
          <DocsOnThisPage sections={sections} relatedPages={relatedPages} previous={previous} next={next} />
        </div>
      </div>
    </section>
  )
}
