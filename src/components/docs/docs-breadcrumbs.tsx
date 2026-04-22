import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  getAudienceLabel,
  getFirstPageForAudience,
  type DocAudience,
  type DocPage,
} from "@/src/lib/docs/content"

type DocsBreadcrumbsProps = {
  page: DocPage | null
}

function renderAudienceCrumb(audience: DocAudience) {
  const firstPage = getFirstPageForAudience(audience)
  if (!firstPage) {
    return <span className="text-muted-foreground">{getAudienceLabel(audience)}</span>
  }

  return (
    <Link href={`/docs/${firstPage.slug}`} className="text-muted-foreground hover:text-foreground">
      {getAudienceLabel(audience)}
    </Link>
  )
}

export default function DocsBreadcrumbs({ page }: DocsBreadcrumbsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="size-3 text-muted-foreground" />
      <Link href="/docs" className="text-muted-foreground hover:text-foreground">
        Docs
      </Link>

      {page ? (
        <>
          <ChevronRight className="size-3 text-muted-foreground" />
          {renderAudienceCrumb(page.audience)}
          <ChevronRight className="size-3 text-muted-foreground" />
          <span className="text-foreground">{page.title}</span>
        </>
      ) : null}
    </div>
  )
}
