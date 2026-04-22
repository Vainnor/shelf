import type { Metadata } from "next"

import PageHeader from "@/src/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

export const metadata: Metadata = {
  title: "Privacy Policy | Shelf",
  description: "How Shelf handles account, reading, and operational data.",
}

const sections = [
  {
    title: "Data we collect",
    points: [
      "Account details such as your name, email address, profile picture, and authentication metadata.",
      "Reading data you add, including books, ISBNs, shelves/status, page counts, notes, reviews, ratings, tags, collections, and progress history.",
      "Preference data such as reminder settings and notification choices.",
      "Operational records such as sessions, audit logs, and basic request metadata needed to keep the app secure and functional.",
    ],
  },
  {
    title: "How we use data",
    points: [
      "To create and secure accounts, authenticate sessions, and keep your account accessible across devices.",
      "To power book tracking features, progress dashboards, reminders, recommendations, reading insights, and export/delete tools.",
      "To operate admin features, detect abuse, and record meaningful moderation or configuration changes in audit logs.",
      "To send transactional email such as password resets, reminders, and important account notifications.",
    ],
  },
  {
    title: "How your data may be shared",
    points: [
      "Shelf does not sell your personal data.",
      "Data may be processed by infrastructure providers that host the app, database, file storage, authentication, or email services used by your deployment.",
      "Self-hosted deployments control their own third-party services, so the exact processors can vary by installation.",
    ],
  },
  {
    title: "Cookies and sessions",
    points: [
      "We use authentication sessions and related cookies or tokens to keep you signed in and to protect your account.",
      "Session data may be used to recognize your browser, maintain login state, and enforce access controls.",
    ],
  },
  {
    title: "Retention and deletion",
    points: [
      "We keep data for as long as your account exists or as needed to operate the service, comply with legal obligations, or resolve abuse and security issues.",
      "You can export your account data from settings in a JSON format.",
      "You can request account deletion from settings; when deleted, your personal account data is removed from that deployment, subject to backup and legal retention requirements.",
    ],
  },
  {
    title: "Security",
    points: [
      "We use authenticated sessions, role-based access controls, and admin-level safeguards for sensitive actions.",
      "Important administrative changes may be recorded in audit logs so operators can review abuse, moderation, or configuration events.",
      "No system is perfectly secure, but we try to keep access limited to the smallest practical set of accounts and services.",
    ],
  },
  {
    title: "Your choices",
    points: [
      "You can update your profile, reading data, and reminder preferences through the app.",
      "You can delete your account or request an export if you no longer want to use the service.",
    ],
  },
  {
    title: "Children",
    points: [
      "Shelf is not intended for children under the age required by the laws that apply to your deployment.",
    ],
  },
  {
    title: "Contact",
    points: [
      "For questions about this policy, contact the administrator of the Shelf deployment you use.",
      "If you are the operator of a self-hosted instance, you should customize this policy to match your legal obligations and actual data processing setup.",
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-svh bg-background p-6 lg:p-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Privacy policy"
          description="Last updated: April 20, 2026"
          breadcrumbCurrentLabel="Privacy"
          breadcrumbRootLabel="Home"
          breadcrumbRootHref="/"
        />

        <Card>
          <CardHeader>
            <CardTitle>How Shelf handles your data</CardTitle>
            <CardDescription>
              This policy explains how Shelf handles account, reading, and operational data in a self-hosted or managed
              deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h2 className="text-base font-medium">{section.title}</h2>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
