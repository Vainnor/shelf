"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { getUnreadNotificationCount } from "@/src/actions/notifications"
import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

type NotificationsButtonProps = {
  className?: string
}

export default function NotificationsButton({ className }: NotificationsButtonProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let mounted = true

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount()
        if (mounted) {
          setUnreadCount(count)
        }
      } catch {
        if (mounted) {
          setUnreadCount(0)
        }
      }
    }

    void fetchUnreadCount()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <Link
      href="/notifications"
      className={cn(buttonVariants({ variant: "outline", size: "icon" }), "relative", className)}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  )
}

