import type { Metadata } from "next"
import { notFound } from "next/navigation"

import DocsShell from "@/src/components/docs/docs-shell"
import { getAllDocsPages, getDocBySlug } from "@/src/lib/docs/content"

type DocsSlugPageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateStaticParams() {
  return getAllDocsPages().map((page) => ({
    slug: page.slug.split("/"),
  }))
}

export async function generateMetadata({ params }: DocsSlugPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = getDocBySlug(slug)

  if (!page) {
    return {
      title: "Doc Not Found",
      description: "The requested documentation page was not found.",
    }
  }

  return {
    title: page.title,
    description: page.summary,
  }
}

export default async function DocsSlugPage({ params }: DocsSlugPageProps) {
  const { slug } = await params
  const page = getDocBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <DocsShell
      title={page.title}
      summary={page.summary}
      badgeLabel={page.audience === "hosted" ? "Hosted Docs" : "Self-host Docs"}
      currentSlug={page.slug}
      sections={page.sections}
    />
  )
}
