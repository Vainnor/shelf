import { TerminalSquare } from "lucide-react"

import { Badge } from "@/src/components/ui/badge"

type DocsCodeBlockProps = {
  code: string
  language: string
  title?: string
}

export default function DocsCodeBlock({ code, language, title }: DocsCodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <TerminalSquare className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title ?? "Command"}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {language}
        </Badge>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  )
}
