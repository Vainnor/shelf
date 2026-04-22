"use client"

import { Command, Search } from "lucide-react"
import { BookOpen, Clock3, Settings } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"

import { searchCommandTargets, type CommandSearchResult, type CommandTarget } from "@/src/actions/command-palette"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { cn } from "@/src/lib/utils"

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

const EMPTY_RESULTS: CommandSearchResult = {
  books: [],
  settings: [],
}

type Section = {
  key: keyof CommandSearchResult | "recent"
  title: string
  items: CommandTarget[]
}

const RECENT_COMMAND_ITEMS_KEY = "shelf.command.recent.v1"
const MAX_RECENT_ITEMS = 8

export default function GlobalCommandBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CommandSearchResult>(EMPTY_RESULTS)
  const [recentItems, setRecentItems] = useState<CommandTarget[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const sections = useMemo<Section[]>(
    () => {
      const allSections: Section[] = [
        ...(query.trim().length === 0 && recentItems.length > 0
          ? [{ key: "recent" as const, title: "Recent", items: recentItems }]
          : []),
        { key: "books", title: "Books", items: results.books },
        { key: "settings", title: "Settings", items: results.settings },
      ]

      return allSections.filter((section) => section.items.length > 0)
    },
    [query, recentItems, results]
  )

  const flattenedItems = useMemo(() => sections.flatMap((section) => section.items), [sections])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (isTypingTarget(event.target) && !open) {
          return
        }

        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_COMMAND_ITEMS_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as CommandTarget[]
      if (Array.isArray(parsed)) {
        setRecentItems(parsed.slice(0, MAX_RECENT_ITEMS))
      }
    } catch {
      // Ignore malformed local history.
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
      return
    }

    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const nextResults = await searchCommandTargets(query)
        if (!cancelled) {
          setResults(nextResults)
          setSelectedIndex(0)
        }
      } catch {
        if (!cancelled) {
          setResults(EMPTY_RESULTS)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [open, query])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  function closePalette() {
    setOpen(false)
  }

  function navigateTo(item: CommandTarget) {
    setRecentItems((current) => {
      const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, MAX_RECENT_ITEMS)
      try {
        window.localStorage.setItem(RECENT_COMMAND_ITEMS_KEY, JSON.stringify(next))
      } catch {
        // Ignore localStorage failures.
      }
      return next
    })

    router.push(item.href)
    closePalette()
  }

  function getSectionIcon(sectionKey: Section["key"]) {
    if (sectionKey === "books") return BookOpen
    if (sectionKey === "settings") return Settings
    return Clock3
  }

  function getItemIcon(item: CommandTarget) {
    if (item.group === "books") return BookOpen
    return Settings
  }

  function onPaletteKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      closePalette()
      return
    }

    if (flattenedItems.length === 0) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSelectedIndex((current) => (current + 1) % flattenedItems.length)
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSelectedIndex((current) => (current - 1 + flattenedItems.length) % flattenedItems.length)
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const selected = flattenedItems[selectedIndex]
      if (selected) {
        navigateTo(selected)
      }
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-40 hidden gap-2 md:flex"
        onClick={() => setOpen(true)}
      >
        <Command className="size-4" />
        Search
        <span className="rounded border border-border/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">Cmd/Ctrl+K</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur-sm" onClick={closePalette}>
          <div
            role="dialog"
            aria-modal="true"
            className="mx-auto mt-16 w-full max-w-2xl rounded-lg border border-border bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={onPaletteKeyDown}
          >
            <div className="border-b border-border p-3">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    "Search books and settings..."
                  }
                  className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-2">
              {loading ? <p className="p-3 text-sm text-muted-foreground">Searching...</p> : null}

              {!loading && sections.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No results found.</p>
              ) : null}

              {!loading
                ? sections.map((section) => {
                    const sectionStart = sections
                      .slice(0, sections.findIndex((item) => item.key === section.key))
                      .reduce((count, item) => count + item.items.length, 0)

                    return (
                      <div key={section.key} className="mb-2 last:mb-0">
                        <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {(() => {
                            const Icon = getSectionIcon(section.key)
                            return <Icon className="size-3.5" />
                          })()}
                          {section.title}
                        </p>
                        <div className="space-y-1">
                          {section.items.map((item, offset) => {
                            const absoluteIndex = sectionStart + offset
                            const selected = absoluteIndex === selectedIndex

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                                onClick={() => navigateTo(item)}
                                className={cn(
                                  "w-full rounded-md px-3 py-2 text-left transition",
                                  "hover:bg-muted",
                                  selected && "bg-muted"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="flex items-center gap-2 text-sm font-medium">
                                    {(() => {
                                      const Icon = getItemIcon(item)
                                      return <Icon className="size-3.5 text-muted-foreground" />
                                    })()}
                                    {item.label}
                                  </p>
                                  <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {item.resultType}
                                  </span>
                                </div>
                                {item.description ? (
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}



