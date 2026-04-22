import { AlertTriangle, Info, ShieldAlert, Sparkles } from "lucide-react"

import { cn } from "@/src/lib/utils"
import type { DocCalloutTone } from "@/src/lib/docs/content"

type DocsCalloutProps = {
  tone: DocCalloutTone
  title: string
  body: string
  items?: string[]
}

const toneStyles: Record<
  DocCalloutTone,
  {
    icon: typeof Info
    wrapper: string
    iconClass: string
  }
> = {
  info: {
    icon: Info,
    wrapper: "border-sky-500/30 bg-sky-500/10",
    iconClass: "text-sky-700 dark:text-sky-300",
  },
  warning: {
    icon: AlertTriangle,
    wrapper: "border-amber-500/30 bg-amber-500/10",
    iconClass: "text-amber-700 dark:text-amber-300",
  },
  danger: {
    icon: ShieldAlert,
    wrapper: "border-destructive/40 bg-destructive/10",
    iconClass: "text-destructive",
  },
  tip: {
    icon: Sparkles,
    wrapper: "border-emerald-500/30 bg-emerald-500/10",
    iconClass: "text-emerald-700 dark:text-emerald-300",
  },
}

export default function DocsCallout({ tone, title, body, items }: DocsCalloutProps) {
  const style = toneStyles[tone]
  const Icon = style.icon

  return (
    <div className={cn("rounded-lg border p-4", style.wrapper)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", style.iconClass)} />
        <div className="space-y-2">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
          {items && items.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
