import { and, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { usersTable } from "@/src/db/schema/user"
import { listReadingRemindersForUser } from "@/src/lib/books"

export type ReminderDispatchResult = {
  checkedUsers: number
  skippedUsers: number
  queuedEmails: number
}

function buildEmailBody(input: { name: string; days: number; reminders: Array<{ title: string; daysInactive: number }> }) {
  const intro = `${input.name}, here are books that have been inactive for at least ${input.days} day(s):`
  const lines = input.reminders.map(
    (item, index) => `${index + 1}. ${item.title} (${item.daysInactive} day(s) inactive)`
  )

  return [intro, "", ...lines, "", "Tip: open Shelf and log a reading session to clear reminders."].join("\n")
}

async function dispatchEmailReminderStub(input: {
  to: string
  name: string
  days: number
  reminders: Array<{ title: string; daysInactive: number }>
}) {
  const body = buildEmailBody(input)
  // Stub transport: replace with provider integration (Postmark/Resend/SES) later.
  console.log(`[reminder-worker] would send email to ${input.to}`)
  console.log(body)
}

export async function runReminderDispatchCycle(maxUsers = 100): Promise<ReminderDispatchResult> {
  const users = await db.query.user.findMany({
    where: and(eq(usersTable.readingReminderEnabled, true), eq(usersTable.readingReminderChannel, "email")),
    limit: maxUsers,
  })

  let skippedUsers = 0
  let queuedEmails = 0

  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    const reminders = await listReadingRemindersForUser(user.id, user.readingReminderDays, 8)
    if (reminders.length === 0) {
      skippedUsers += 1
      continue
    }

    // eslint-disable-next-line no-await-in-loop
    await dispatchEmailReminderStub({
      to: user.email,
      name: user.name ?? user.email,
      days: user.readingReminderDays,
      reminders,
    })
    queuedEmails += 1
  }

  return {
    checkedUsers: users.length,
    skippedUsers,
    queuedEmails,
  }
}

