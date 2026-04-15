import { ArrowRight, BookOpen, CheckCircle2, PencilLine } from "lucide-react"
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
import { Separator } from "@/src/components/ui/separator"
import { cn } from "@/src/lib/utils"

const shelves = [
  {
    title: "To read",
    description: "A backlog of books you want to pick up next.",
    count: 12,
    accent: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    title: "Currently reading",
    description: "Everything in progress, with page tracking and notes.",
    count: 4,
    accent: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    title: "Read",
    description: "Finished books, ratings, and what you want to revisit.",
    count: 28,
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
]

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:py-14">
        <div className="flex flex-col gap-4">
          <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
            <BookOpen className="size-3.5" />
            Shelf MVP
          </Badge>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Track every book you want to read, are reading, and have already finished.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Shelf is a lightweight personal library built with Better Auth, Drizzle,
              and shadcn/ui. Start with email/password auth, then move books across
              your three reading states with notes and progress tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
            >
              Add your first book
              <PencilLine className="size-4" />
            </Link>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          {shelves.map((shelf) => (
            <Card key={shelf.title} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{shelf.title}</CardTitle>
                  <Badge className={shelf.accent}>{shelf.count} books</Badge>
                </div>
                <CardDescription>{shelf.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  Next step: connect this shelf to authenticated user data and render
                  books from Drizzle.
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Ready for CRUD actions
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
