import { CheckCircle2, Mail, UserRound } from "lucide-react"

import AvatarSettings from "@/src/components/profile/avatar-settings"
import PageHeader from "@/src/components/layout/page-header"
import NotificationsButton from "@/src/components/notifications/notifications-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { getProfileSummary } from "@/src/actions/profile"

export default async function ProfilePage() {
  const { user, stats } = await getProfileSummary()
  const joinedDate = new Date(user.createdAt).toLocaleDateString()
  const updatedDate = new Date(user.updatedAt).toLocaleDateString()

  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Your profile"
          description="View and manage the core details for your Shelf account."
          breadcrumbCurrentLabel="Profile"
          actions={<NotificationsButton />}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" />
              Account details
            </CardTitle>
            <CardDescription>
              This is your current authenticated identity information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Name:</span> {user.name ?? "Not set"}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span>
                <span className="font-medium">Email:</span> {user.email}
              </span>
            </p>
            <p>
              <span className="font-medium">User ID:</span> {user.id}
            </p>
            <p>
              <span className="font-medium">Role:</span> {user.role}
            </p>
            <p>
              <span className="font-medium">Email verified:</span> {user.emailVerified ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-medium">Member since:</span> {joinedDate}
            </p>
            <p>
              <span className="font-medium">Last updated:</span> {updatedDate}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total books</p>
              <p className="mt-1 text-2xl font-semibold">{stats.totalBooks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">To read</p>
              <p className="mt-1 text-2xl font-semibold">{stats.toRead}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reading</p>
              <p className="mt-1 text-2xl font-semibold">{stats.reading}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                <CheckCircle2 className="size-5 text-emerald-600" />
                {stats.read}
              </p>
            </CardContent>
          </Card>
        </div>

        <AvatarSettings name={user.name} email={user.email} currentImage={user.image} />
      </section>
    </main>
  )
}
