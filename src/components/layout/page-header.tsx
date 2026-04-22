"use client"

import type { ReactNode } from "react"

import BreadcrumbChip, { type BreadcrumbItem } from "@/src/components/navigation/breadcrumb-chip"
import { cn } from "@/src/lib/utils"

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbItems?: BreadcrumbItem[]
  breadcrumbCurrentHref?: string
  breadcrumbCurrentLabel?: string
  breadcrumbRootHref?: string
  breadcrumbRootLabel?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumbItems,
  breadcrumbCurrentHref,
  breadcrumbCurrentLabel,
  breadcrumbRootHref,
  breadcrumbRootLabel,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0 flex-1 space-y-2">
        <BreadcrumbChip
          items={breadcrumbItems}
          currentHref={breadcrumbCurrentHref}
          currentLabel={breadcrumbCurrentLabel}
          rootHref={breadcrumbRootHref}
          rootLabel={breadcrumbRootLabel}
        />
        <h1 className={cn("text-3xl font-semibold tracking-tight sm:text-4xl", titleClassName)}>{title}</h1>
        {description ? <p className={cn("text-muted-foreground", descriptionClassName)}>{description}</p> : null}
      </div>

      {actions ? <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">{actions}</div> : null}
    </header>
  )
}
