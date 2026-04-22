import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Docs | Shelf",
    template: "%s | Shelf Docs",
  },
  description: "Hosted usage and self-hosting documentation for Shelf.",
}

export default function DocsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-45 bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-background/80 to-muted/10" />
      {children}
    </main>
  )
}
