"use client"

import { BookOpen, ChevronDown, LayoutDashboard, LogOut, Settings, Shield, UserRound, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { authClient } from "@/src/lib/auth-client"
import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

type ProfileMenuProps = {
  name: string | null | undefined
  email: string | null | undefined
  image?: string | null
  isAdmin?: boolean
  username?: string | null
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const candidate = (name?.trim() || email?.trim()) || "User"
  const parts = candidate.split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "U"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
}

export default function ProfileMenu({
  name,
  email,
  image,
  isAdmin = false,
  username,
}: ProfileMenuProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [avatarError, setAvatarError] = React.useState(false)

  React.useEffect(() => {
    setAvatarError(false)
  }, [image])

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut()
      router.push("/login")
      router.refresh()
    })
  }

  const initials = getInitials(name, email)

  return (
    <details className="relative">
      <summary
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "list-none gap-2 pr-2 [&::-webkit-details-marker]:hidden"
        )}
      >
        {image && !avatarError ? (
          <img
            src={image}
            alt="Profile avatar"
            className="size-7 rounded-full border border-border object-cover mt-1"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
            {initials}
          </span>
        )}
        <span className="hidden text-sm md:inline">Profile</span>
        <ChevronDown className="size-4" />
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Link>

        {isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <Shield className="size-4" />
            Admin
          </Link>
        ) : null}

        <Link
          href="/library"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <BookOpen className="size-4" />
          Library
        </Link>

        <Link
          href="/social"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <Users className="size-4" />
          Social
        </Link>

        {username ? (
          <Link
            href={`/u/${username}`}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            <Users className="size-4" />
            Public profile
          </Link>
        ) : null}

        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <UserRound className="size-4" />
          Profile
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
        >
          <Settings className="size-4" />
          Settings
        </Link>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-70"
          onClick={handleSignOut}
          disabled={isPending}
        >
          <LogOut className="size-4" />
          {isPending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </details>
  )
}

