import { CheckCircle2, Circle } from "lucide-react"

import DocsCallout from "@/src/components/docs/docs-callout"
import DocsCodeBlock from "@/src/components/docs/docs-code-block"
import type { DocSection, DocSectionBlock } from "@/src/lib/docs/content"

type DocsContentRendererProps = {
  sections: DocSection[]
}

function renderList(block: Extract<DocSectionBlock, { type: "list" }>, key: string) {
  const ListTag = block.style === "ordered" ? "ol" : "ul"

  return (
    <ListTag
      key={key}
      className={`space-y-1.5 pl-5 text-sm text-muted-foreground ${
        block.style === "ordered" ? "list-decimal" : "list-disc"
      }`}
    >
      {block.items.map((item) => (
        <li key={item} className="leading-6">
          {item}
        </li>
      ))}
    </ListTag>
  )
}

function renderTable(block: Extract<DocSectionBlock, { type: "table" }>, key: string) {
  return (
    <div key={key} className="overflow-x-auto rounded-lg border border-border/70">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {block.columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="border-t border-border/60">
              {row.map((value, valueIndex) => (
                <td key={`${value}-${valueIndex}`} className="px-3 py-2 align-top text-muted-foreground">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderChecklist(block: Extract<DocSectionBlock, { type: "checklist" }>, key: string) {
  return (
    <ul key={key} className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
      {block.items.map((item) => (
        <li key={item.label} className="flex items-start gap-2">
          {item.checked ? (
            <CheckCircle2 className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Circle className="mt-0.5 size-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

function renderBlock(block: DocSectionBlock, key: string) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={key} className="text-sm leading-7 text-muted-foreground">
          {block.text}
        </p>
      )
    case "list":
      return renderList(block, key)
    case "callout":
      return (
        <DocsCallout
          key={key}
          tone={block.tone}
          title={block.title}
          body={block.body}
          items={block.items}
        />
      )
    case "code":
      return <DocsCodeBlock key={key} code={block.code} language={block.language} title={block.title} />
    case "table":
      return renderTable(block, key)
    case "checklist":
      return renderChecklist(block, key)
    default:
      return null
  }
}

export default function DocsContentRenderer({ sections }: DocsContentRendererProps) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
            {section.summary ? <p className="text-sm text-muted-foreground">{section.summary}</p> : null}
          </div>
          <div className="space-y-4">
            {section.blocks.map((block, blockIndex) => renderBlock(block, `${section.id}-${blockIndex}`))}
          </div>
        </section>
      ))}
    </div>
  )
}
