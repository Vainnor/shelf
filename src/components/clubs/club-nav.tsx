"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

type ClubNavProps = {
  clubId: string
  role: "owner" | "moderator" | "member"
}

export default function ClubNav({ clubId, role }: ClubNavProps) {
  const pathname = usePathname()

  const items = [
    { href: `/clubs/${clubId}`, label: "Overview" },
    { href: `/clubs/${clubId}/shelf`, label: "Shelf" },
    { href: `/clubs/${clubId}/posts`, label: "Posts" },
    { href: `/clubs/${clubId}/members`, label: "Members" },
    ...(role === "owner" || role === "moderator"
      ? [{ href: `/clubs/${clubId}/moderation`, label: "Moderation" }]
      : []),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
              "h-8"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

