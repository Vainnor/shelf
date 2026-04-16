import Link from "next/link"

import { getClubPageData } from "@/src/actions/clubs"
import { Badge } from "@/src/components/ui/badge"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { cn } from "@/src/lib/utils"

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getClubPageData(id)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>All readers currently in this club.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data?.members.length ? (
          data.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{member.user?.name || member.user?.username || member.user?.email}</p>
                <p className="text-xs text-muted-foreground">@{member.user?.username ?? member.user?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{member.role}</Badge>
                {member.user?.username ? (
                  <Link
                    href={`/u/${member.user.username}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                  >
                    Profile
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No members found.</p>
        )}
      </CardContent>
    </Card>
  )
}

