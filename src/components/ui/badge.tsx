import * as React from "react"

import { cn } from "@/src/lib/utils"

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Badge }

