import BreadcrumbChip, { type BreadcrumbItem } from "@/src/components/navigation/breadcrumb-chip"

import {
  getAudienceLabel,
  getFirstPageForAudience,
  type DocAudience,
  type DocPage,
} from "@/src/lib/docs/content"

type DocsBreadcrumbsProps = {
  page: DocPage | null
}

function getAudienceCrumb(audience: DocAudience): BreadcrumbItem {
  const firstPage = getFirstPageForAudience(audience)
  if (!firstPage) {
    return { label: getAudienceLabel(audience) }
  }

  return {
    label: getAudienceLabel(audience),
    href: `/docs/${firstPage.slug}`,
  }
}

export function buildDocsBreadcrumbItems(page: DocPage | null): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Docs", href: "/docs" },
  ]

  if (!page) {
    return items
  }

  items.push(getAudienceCrumb(page.audience))
  items.push({ label: page.title, href: `/docs/${page.slug}` })

  return items
}

export default function DocsBreadcrumbs({ page }: DocsBreadcrumbsProps) {
  return <BreadcrumbChip items={buildDocsBreadcrumbItems(page)} currentLabel={page?.title ?? "Docs"} />
}
