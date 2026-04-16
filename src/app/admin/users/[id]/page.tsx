import { eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { updateUserByAdmin } from "@/src/actions/admin-users"
import { buttonVariants } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { db } from "@/src/db"
import { userRoles, usersTable } from "@/src/db/schema/user"
import { requireAdminUser } from "@/src/lib/admin"
import { cn } from "@/src/lib/utils"

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params

  const user = await db.query.user.findFirst({
    where: eq(usersTable.id, id),
  })

  if (!user) {
    notFound()
  }

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit user</h1>
            <p className="text-muted-foreground">Update profile fields for this account.</p>
          </div>
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{user.email}</CardTitle>
            <CardDescription>Edit the name/email pair used for login and display.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateUserByAdmin} className="space-y-3">
              <input type="hidden" name="userId" value={user.id} />
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="name">
                  Name
                </label>
                <Input id="name" name="name" defaultValue={user.name ?? ""} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input id="email" name="email" type="email" defaultValue={user.email} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={user.role}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {userRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={cn(buttonVariants({ variant: "default", size: "default" }))}>
                Save changes
              </button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

