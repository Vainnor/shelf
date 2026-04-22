import Link from "next/link"

import { Badge } from "@/src/components/ui/badge"
import { cn } from "@/src/lib/utils"
import type { DocSidebarGroup, DocSlug } from "@/src/lib/docs/content"

type DocsSidebarProps = {
  groups: DocSidebarGroup[]
  currentSlug?: DocSlug | null
  compact?: boolean
}

export default function DocsSidebar({ groups, currentSlug, compact = false }: DocsSidebarProps) {
  return (
    <nav className={cn("space-y-4", compact ? "" : "sticky top-24")}>
      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Documentation</p>
        <Link href="/docs" className="mt-2 block rounded-md px-2 py-1 text-sm font-medium hover:bg-muted/60">
          Docs home
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.audience} className="rounded-xl border border-border/70 bg-card/80 p-3">
          <div className="mb-2 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{group.title}</p>
              <Badge variant="outline" className="text-[10px] uppercase">
                {group.items.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </div>

          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.slug === currentSlug
              return (
                <Link
                  key={item.slug}
                  href={`/docs/${item.slug}`}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary/12 text-foreground ring-1 ring-primary/30"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
