import Link from "next/link"

import type { DocPage, DocSection } from "@/src/lib/docs/content"

type DocsOnThisPageProps = {
  sections: DocSection[]
  relatedPages: DocPage[]
  previous: DocPage | null
  next: DocPage | null
}

export default function DocsOnThisPage({ sections, relatedPages, previous, next }: DocsOnThisPageProps) {
  return (
    <aside className="sticky top-24 space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/80 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">On this page</p>
        {sections.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No section anchors for this page.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/80 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Related</p>
        {relatedPages.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No related pages.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {relatedPages.map((page) => (
              <li key={page.slug}>
                <Link href={`/docs/${page.slug}`} className="text-muted-foreground hover:text-foreground">
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/80 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Continue</p>
        <div className="mt-2 space-y-2 text-sm">
          {previous ? (
            <div>
              <p className="text-[11px] text-muted-foreground">Previous</p>
              <Link href={`/docs/${previous.slug}`} className="text-muted-foreground hover:text-foreground">
                {previous.title}
              </Link>
            </div>
          ) : null}
          {next ? (
            <div>
              <p className="text-[11px] text-muted-foreground">Next</p>
              <Link href={`/docs/${next.slug}`} className="text-muted-foreground hover:text-foreground">
                {next.title}
              </Link>
            </div>
          ) : null}
          {!previous && !next ? <p className="text-muted-foreground">No adjacent pages.</p> : null}
        </div>
      </div>
    </aside>
  )
}
