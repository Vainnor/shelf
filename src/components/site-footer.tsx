import Link from "next/link"

import packageJson from "../../package.json"

export default function SiteFooter() {
  const buildVersion = process.env.NEXT_PUBLIC_APP_VERSION
  const footerVersion = buildVersion
    ? buildVersion.replace(/\.(?=[^.]+$)/, "-")
    : packageJson.version

  return (
    <footer className="border-t border-border/70 bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3 text-xs text-muted-foreground">
        <span>
          Shelf <span className="text-muted-foreground/80">v{footerVersion}</span>
        </span>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <a
            href="https://github.com/Vainnor/shelf"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
