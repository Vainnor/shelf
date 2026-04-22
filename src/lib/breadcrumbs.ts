import type { ReactNode } from "react"

export type BreadcrumbItem = {
  label: string
  href?: string
  icon?: ReactNode
}

type BuildFallbackCrumbsOptions = {
  rootHref?: string
  rootLabel?: string
  currentLabel?: string
}

function stripQueryAndHash(pathname: string) {
  const [pathWithoutQuery] = pathname.split("?")
  const [pathWithoutHash] = pathWithoutQuery.split("#")
  return pathWithoutHash
}

export function normalizePathname(pathname: string) {
  if (!pathname.trim()) {
    return "/"
  }

  const prefixedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  const normalized = stripQueryAndHash(prefixedPath)

  if (normalized === "/") {
    return normalized
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized
}

function toTitleCase(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ")
}

function isBookDetail(pathname: string) {
  return /^\/books\/[^/]+$/.test(pathname)
}

function isBookEdit(pathname: string) {
  return /^\/books\/[^/]+\/edit$/.test(pathname)
}

function isAdminUserEdit(pathname: string) {
  return /^\/admin\/users\/[^/]+$/.test(pathname)
}

function isDocsSlug(pathname: string) {
  return /^\/docs\/.+$/.test(pathname)
}

function getBookId(pathname: string) {
  const parts = normalizePathname(pathname).split("/").filter(Boolean)
  return parts[1]
}

function getAdminUserId(pathname: string) {
  const parts = normalizePathname(pathname).split("/").filter(Boolean)
  return parts[2]
}

function buildRouteHierarchy(pathname: string): BreadcrumbItem[] {
  const path = normalizePathname(pathname)

  if (path === "/dashboard") {
    return [{ label: "Dashboard", href: "/dashboard" }]
  }

  if (path === "/library") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Library", href: "/library" },
    ]
  }

  if (path === "/board") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Board", href: "/board" },
    ]
  }

  if (path === "/timer") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Timer", href: "/timer" },
    ]
  }

  if (path === "/books/new") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Library", href: "/library" },
      { label: "New", href: "/books/new" },
    ]
  }

  if (isBookDetail(path)) {
    const bookId = getBookId(path)
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Library", href: "/library" },
      { label: "Book", href: bookId ? `/books/${bookId}` : undefined },
    ]
  }

  if (isBookEdit(path)) {
    const bookId = getBookId(path)
    const bookHref = bookId ? `/books/${bookId}` : undefined
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Library", href: "/library" },
      { label: "Book", href: bookHref },
      { label: "Edit", href: path },
    ]
  }

  if (path === "/settings") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Settings", href: "/settings" },
    ]
  }

  if (path === "/profile") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Profile", href: "/profile" },
    ]
  }

  if (path === "/notifications") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Notifications", href: "/notifications" },
    ]
  }

  if (path === "/admin") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
    ]
  }

  if (path === "/admin/audit") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Audit", href: "/admin/audit" },
    ]
  }

  if (path === "/admin/health") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Health", href: "/admin/health" },
    ]
  }

  if (path === "/admin/backup") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Backup", href: "/admin/backup" },
    ]
  }

  if (isAdminUserEdit(path)) {
    const userId = getAdminUserId(path)
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Edit user", href: userId ? `/admin/users/${userId}` : undefined },
    ]
  }

  if (path === "/docs") {
    return [
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs" },
    ]
  }

  if (isDocsSlug(path)) {
    return [
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs" },
      { label: "Doc", href: path },
    ]
  }

  if (path === "/privacy") {
    return [
      { label: "Home", href: "/" },
      { label: "Legal" },
      { label: "Privacy", href: "/privacy" },
    ]
  }

  if (path === "/terms") {
    return [
      { label: "Home", href: "/" },
      { label: "Legal" },
      { label: "Terms", href: "/terms" },
    ]
  }

  const segments = path.split("/").filter(Boolean)

  if (segments.length === 0) {
    return [{ label: "Home", href: "/" }]
  }

  return segments.map((segment, index) => ({
    label: toTitleCase(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }))
}

export function resolveRouteLabel(pathname: string) {
  const path = normalizePathname(pathname)

  if (path === "/") return "Home"
  if (path === "/dashboard") return "Dashboard"
  if (path === "/library") return "Library"
  if (path === "/board") return "Board"
  if (path === "/timer") return "Timer"
  if (path === "/books/new") return "New"
  if (isBookDetail(path)) return "Book"
  if (isBookEdit(path)) return "Edit"
  if (path === "/settings") return "Settings"
  if (path === "/profile") return "Profile"
  if (path === "/notifications") return "Notifications"
  if (path === "/admin") return "Admin"
  if (path === "/admin/audit") return "Audit"
  if (path === "/admin/health") return "Health"
  if (path === "/admin/backup") return "Backup"
  if (isAdminUserEdit(path)) return "Edit user"
  if (path === "/docs") return "Docs"
  if (isDocsSlug(path)) return "Doc"
  if (path === "/privacy") return "Privacy"
  if (path === "/terms") return "Terms"

  const segments = path.split("/").filter(Boolean)
  const tail = segments.at(-1)
  return tail ? toTitleCase(tail) : "Home"
}

export function buildFallbackCrumbs(pathname: string, options: BuildFallbackCrumbsOptions = {}) {
  const path = normalizePathname(pathname)
  const hierarchy = buildRouteHierarchy(path)

  if (hierarchy.length === 0) {
    return [{ label: options.currentLabel ?? resolveRouteLabel(path), href: path }]
  }

  const next = hierarchy.map((crumb) => ({ ...crumb }))

  if (next[0] && options.rootLabel) {
    next[0] = {
      ...next[0],
      label: options.rootLabel,
      href: options.rootHref ?? next[0].href,
    }
  } else if (options.rootLabel) {
    next.unshift({
      label: options.rootLabel,
      href: options.rootHref,
    })
  }

  if (options.rootHref && next[0]) {
    next[0] = {
      ...next[0],
      href: options.rootHref,
    }
  }

  const currentLabel = options.currentLabel ?? resolveRouteLabel(path)
  const lastIndex = next.length - 1

  if (lastIndex >= 0) {
    next[lastIndex] = {
      ...next[lastIndex],
      label: currentLabel,
      href: path,
    }
  }

  return next
}
