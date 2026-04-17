import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import SiteFooter from "@/src/components/site-footer"
import { ThemeProvider } from "@/src/components/theme-provider"
import ReleaseAnnouncementGate from "@/src/components/release/release-announcement-gate"
import { cn } from "@/src/lib/utils"
import { Toaster } from "@/src/components/ui/sonner"

export const metadata: Metadata = {
  title: "Shelf",
  description: "Track the books you want to read, are reading, and have finished.",
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
          <ReleaseAnnouncementGate />
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
