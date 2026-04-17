import { and, eq } from "drizzle-orm"

import { db } from "@/src/db"
import { booksTable } from "@/src/db/schema/book"
import { readingReminderEventsTable, reminderEventTypes } from "@/src/db/schema/reading"
import { usersTable } from "@/src/db/schema/user"
import { listReadingRemindersForUser } from "@/src/lib/books"
import { createTypedNotification } from "@/src/lib/notifications"

export type ReminderEventType = (typeof reminderEventTypes)[number]

export type ReminderAction = "snooze" | "dismiss" | "mark_reading"

export type RecordReminderEventInput = {
  userId: string
  bookId: string
  eventType: ReminderEventType
  details?: string | null
}

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

export async function recordReminderEvent(input: RecordReminderEventInput) {
  const [event] = await db
    .insert(readingReminderEventsTable)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      bookId: input.bookId,
      eventType: input.eventType,
      details: input.details ?? null,
    })
    .returning()

  return event
}

export async function snoozeReminder(userId: string, bookId: string, snoozedUntil: Date) {
  const [book] = await db
    .update(booksTable)
    .set({
      snoozedUntil,
      reminderDismissedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)))
    .returning()

  if (book) {
    await recordReminderEvent({
      userId,
      bookId,
      eventType: "snoozed",
      details: `until:${snoozedUntil.toISOString()}`,
    })
  }

  return book
}

export async function dismissReminder(userId: string, bookId: string) {
  const [book] = await db
    .update(booksTable)
    .set({
      reminderDismissedAt: new Date(),
      snoozedUntil: null,
      updatedAt: new Date(),
    })
    .where(and(eq(booksTable.id, bookId), eq(booksTable.userId, userId)))
    .returning()

  if (book) {
    await recordReminderEvent({
      userId,
      bookId,
      eventType: "dismissed",
    })
  }

  return book
}

export async function runReminderDispatchCycle(maxUsers = 100): Promise<ReminderDispatchResult> {
  const users = await db.query.user.findMany({
    where: and(eq(usersTable.readingReminderEnabled, true), eq(usersTable.readingReminderChannel, "email")),
    limit: maxUsers,
  })

  let skippedUsers = 0
  let queuedEmails = 0

  for (const user of users) {
    const reminders = await listReadingRemindersForUser(user.id, user.readingReminderDays, 8)
    if (reminders.length === 0) {
      skippedUsers += 1
      continue
    }

    await dispatchEmailReminderStub({
      to: user.email,
      name: user.name ?? user.email,
      days: user.readingReminderDays,
      reminders,
    })

    const reminderTimestamp = new Date()
    for (const reminder of reminders) {
      await db
        .update(booksTable)
        .set({
          lastRemindedAt: reminderTimestamp,
          updatedAt: new Date(),
        })
        .where(and(eq(booksTable.id, reminder.id), eq(booksTable.userId, user.id)))

      await recordReminderEvent({
        userId: user.id,
        bookId: reminder.id,
        eventType: "sent",
        details: `channel:email;days:${user.readingReminderDays}`,
      })

      await createTypedNotification({
        kind: "reading.reminder",
        userId: user.id,
        bookTitle: reminder.title,
        daysInactive: reminder.daysInactive,
        href: `/books/${reminder.id}`,
      })
    }
    queuedEmails += 1
  }

  return {
    checkedUsers: users.length,
    skippedUsers,
    queuedEmails,
  }
}

