import { ArrowRight, BookOpen, LibraryBig, ListChecks, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import { getSystemSettings } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

export const dynamic = "force-dynamic"

const shelves = [
  {
    title: "To read",
    description: "Capture books you discover and keep your next reads organized.",
    note: "A clean queue for future reads.",
    accent: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  {
    title: "Currently reading",
    description: "Track progress with pages, notes, and reading momentum.",
    note: "Keep your active book front and center.",
    accent: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    title: "Read",
    description: "Build a personal archive of completed books and reflections.",
    note: "A finished library you can come back to later.",
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
]

const highlights = [
  {
    title: "A clear reading workflow",
    description: "Move books between shelves in seconds and always know what to read next.",
    icon: ListChecks,
  },
  {
    title: "Beautiful visual library",
    description: "Use cover art to browse your collection like a real bookshelf.",
    icon: LibraryBig,
  },
  {
    title: "Private by default",
    description: "Secure sign-in with Better Auth and full control of your self-hosted data.",
    icon: ShieldCheck,
  },
]

const demoCovers = Array.from({ length: 10 }, (_, i) => `/book${i + 1}.jpg`)

export default async function Page() {
  const settings = await getSystemSettings()
  const canUseSignup = settings.bootstrapCompleted && settings.signupsEnabled

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-45 bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-background/70 to-muted/10" />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-b from-background to-muted/20 p-7 shadow-sm sm:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle,rgba(148,163,184,0.28)_1px,transparent_1px)] bg-size-[18px_18px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.14)_1px,transparent_1px)]" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-sky-500/5" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />

          <div className="relative flex flex-col gap-6">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <Sparkles className="size-3.5" />
              Shelf
            </Badge>

            <div className="max-w-4xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                A modern reading tracker for people who actually finish books.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Organize everything you want to read, track what you are reading now,
                and build a meaningful archive of what you have completed. Shelf keeps
                your personal library clean, visual, and easy to maintain.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={canUseSignup ? "/signup" : "/login"}
                className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}
              >
                {canUseSignup ? "Create your account" : "Log in"}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "default" }), "gap-2")}
              >
                Open dashboard
              </Link>
            </div>

            {!settings.bootstrapCompleted ? (
              <p className="text-sm text-muted-foreground">
                Initial setup is required before sign up. Continue with admin bootstrap.
                <Link href="/setup/admin" className="ml-2 underline underline-offset-4">
                  Complete setup
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((highlight) => (
            <Card
              key={highlight.title}
              className="h-full border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <highlight.icon className="size-5 text-primary" />
                  {highlight.title}
                </CardTitle>
                <CardDescription>{highlight.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {shelves.map((shelf, index) => (
            <Card
              key={shelf.title}
              className="group h-full border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Badge className={cn("border", shelf.accent)}>
                      {String(index + 1).padStart(2, "0")}
                    </Badge>
                    <CardTitle className="text-xl tracking-tight">{shelf.title}</CardTitle>
                  </div>
                </div>
                <CardDescription>{shelf.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-xl border border-border/70 bg-muted/25 p-4 text-sm leading-6 text-muted-foreground transition-colors group-hover:bg-muted/35">
                  {shelf.note}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Visual Library Experience
            </CardTitle>
            <CardDescription>
              Browse your books with covers, filter by reading status, and jump into details instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="grid grid-cols-5 gap-2 rounded-xl border border-border/70 bg-muted/40 p-4">
              {demoCovers.map((cover, index) => (
                <img
                  key={cover}
                  src={cover}
                  alt={`Book cover ${index + 1}`}
                  className="h-36 w-full rounded-sm object-cover shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center justify-between rounded-md bg-background p-3">
                <span className="text-sm font-medium">The Great Hunt</span>
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300">Reading</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background p-3">
                <span className="text-sm font-medium">The Name of the Wind</span>
                <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300">To Read</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background p-3">
                <span className="text-sm font-medium">Mistborn</span>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Read</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border/70 bg-muted/30 p-6 text-center sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to make reading feel organized?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Create your account, add your first books, and keep every reading goal in one place.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={canUseSignup ? "/signup" : "/login"}
              className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}
            >
              {canUseSignup ? "Start for free" : "Sign in"}
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "default" })}>
              Existing user login
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            By using Shelf, you agree to your deployment policies including{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
