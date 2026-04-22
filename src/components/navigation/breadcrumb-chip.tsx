"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import {
  buildFallbackCrumbs,
  normalizePathname,
  resolveRouteLabel,
  type BreadcrumbItem,
} from "@/src/lib/breadcrumbs"
import { cn } from "@/src/lib/utils"

const BREADCRUMB_HISTORY_KEY = "shelf.breadcrumb.history.v1"
const BREADCRUMB_HISTORY_LIMIT = 14

type BreadcrumbChipProps = {
  items?: BreadcrumbItem[]
  currentHref?: string
  currentLabel?: string
  rootHref?: string
  rootLabel?: string
  className?: string
}

type BreadcrumbHistoryEntry = {
  href: string
  label: string
}

function parseStoredHistory(raw: string | null) {
  if (!raw) {
    return [] as BreadcrumbHistoryEntry[]
  }

  try {
    const parsed = JSON.parse(raw) as BreadcrumbHistoryEntry[]

    if (!Array.isArray(parsed)) {
      return [] as BreadcrumbHistoryEntry[]
    }

    return parsed
      .filter((entry) => typeof entry?.href === "string" && typeof entry?.label === "string")
      .map((entry) => ({
        href: normalizePathname(entry.href),
        label: entry.label.trim(),
      }))
      .filter((entry) => Boolean(entry.href) && Boolean(entry.label))
  } catch {
    return [] as BreadcrumbHistoryEntry[]
  }
}

export type { BreadcrumbItem }

export default function BreadcrumbChip({
  items,
  currentHref,
  currentLabel,
  rootHref,
  rootLabel,
  className,
}: BreadcrumbChipProps) {
  const pathname = usePathname()
  const [historyTrail, setHistoryTrail] = useState<BreadcrumbHistoryEntry[]>(() => {
    if (typeof window === "undefined") {
      return []
    }

    return parseStoredHistory(window.sessionStorage.getItem(BREADCRUMB_HISTORY_KEY))
  })

  const activeHref = normalizePathname(currentHref ?? pathname ?? "/")
  const activeLabel = currentLabel?.trim() || resolveRouteLabel(activeHref)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistoryTrail((current) => {
      let next = [...current]
      const existingIndex = next.findIndex((entry) => entry.href === activeHref)

      if (existingIndex >= 0) {
        next = next.slice(0, existingIndex + 1)
        next[existingIndex] = { href: activeHref, label: activeLabel }
      } else {
        next.push({ href: activeHref, label: activeLabel })
      }

      if (next.length > BREADCRUMB_HISTORY_LIMIT) {
        next = next.slice(next.length - BREADCRUMB_HISTORY_LIMIT)
      }

      window.sessionStorage.setItem(BREADCRUMB_HISTORY_KEY, JSON.stringify(next))
      return next
    })
  }, [activeHref, activeLabel])

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    if (items?.length) {
      return items.map((item, index) => {
        const isLast = index === items.length - 1
        if (!isLast) {
          return item
        }

        return {
          ...item,
          label: currentLabel?.trim() || item.label,
          href: item.href ?? activeHref,
        }
      })
    }

    const historyCanDrive =
      historyTrail.length > 1 &&
      historyTrail.at(-1)?.href === activeHref

    if (historyCanDrive) {
      return historyTrail.map<BreadcrumbItem>((entry, index) => {
        const isLast = index === historyTrail.length - 1
        return {
          label: isLast ? activeLabel : entry.label,
          href: entry.href,
        }
      })
    }

    return buildFallbackCrumbs(activeHref, {
      rootHref,
      rootLabel,
      currentLabel: activeLabel,
    })
  }, [activeHref, activeLabel, currentLabel, historyTrail, items, rootHref, rootLabel])

  const currentIndex = breadcrumbItems.length - 1

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ol className="flex min-w-max items-center gap-1 rounded-4xl border border-border/70 bg-linear-to-r from-background via-muted/35 to-background px-2 py-1 shadow-xs ring-1 ring-background/50">
          {breadcrumbItems.map((item, index) => {
            const key = `${item.href ?? item.label}-${index}`
            const isCurrent = index === currentIndex
            const href = item.href ? normalizePathname(item.href) : undefined

            return (
              <li key={key} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" /> : null}

                {isCurrent || !href ? (
                  <span
                    className="inline-flex h-7 items-center gap-1 rounded-full bg-primary/10 px-3 text-xs font-medium text-foreground"
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{isCurrent ? activeLabel : item.label}</span>
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="inline-flex h-7 items-center gap-1 rounded-full px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
