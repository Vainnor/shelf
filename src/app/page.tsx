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
    accent: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  {
    title: "Currently reading",
    description: "Track progress with pages, notes, and reading momentum.",
    accent: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    title: "Read",
    description: "Build a personal archive of completed books and reflections.",
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
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:py-14">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-background to-muted/20 p-7 shadow-sm sm:p-10">
          <div className="absolute -right-14 -top-14 size-36 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 size-40 rounded-full bg-sky-500/10 blur-2xl" />

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
          {shelves.map((shelf) => (
            <Card
              key={shelf.title}
              className="h-full border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{shelf.title}</CardTitle>
                  <Badge className={cn("border", shelf.accent)}>{shelf.title}</Badge>
                </div>
                <CardDescription>{shelf.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  Built for fast organization and effortless status updates.
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
