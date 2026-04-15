import { redirect } from "next/navigation"

import { BootstrapForm } from "@/src/components/admin/bootstrap-form"
import { isBootstrapCompleted } from "@/src/lib/admin"

export const dynamic = "force-dynamic"

export default async function AdminSetupPage() {
  const completed = await isBootstrapCompleted()

  if (completed) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <BootstrapForm />
    </main>
  )
}

