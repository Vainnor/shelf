import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

import { requireAuthenticatedUser } from "@/src/lib/admin"
import { requireClubMembership } from "@/src/lib/clubs"
import ProfileMenu from "@/src/components/auth/profile-menu"
import ClubNav from "@/src/components/clubs/club-nav"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { session, user } = await requireAuthenticatedUser()
  const { club, membership } = await requireClubMembership(id, user.id)

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge className="w-fit gap-1.5 px-3 py-1 text-xs uppercase tracking-wide">
              <Users className="size-3.5" />
              Club
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{club.name}</h1>
            <p className="text-muted-foreground">{club.description || "No description provided."}</p>
            <p className="text-xs text-muted-foreground">Your role: {membership.role}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/social" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}>
              <ArrowLeft className="size-4" />
              Social
            </Link>
            <ProfileMenu
              name={session.user.name ?? ""}
              email={session.user.email ?? ""}
              image={session.user.image}
              isAdmin={user.role === "admin"}
              username={user.username}
            />
          </div>
        </div>

        <ClubNav clubId={id} role={membership.role} />

        {children}
      </section>
    </main>
  )
}

