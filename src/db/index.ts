import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
} from "./schema/user"
import { booksTable } from "./schema/book"
import {
  bookHighlightsTable,
  bookProgressEventsTable,
  bookTagsTable,
  collectionBooksTable,
  collectionsTable,
  notificationsTable,
  readingReminderEventsTable,
  readingGoalsTable,
  recommendationFeedbackTable,
  readingSessionsTable,
  sharedCollectionMembersTable,
  tagsTable,
} from "./schema/reading"
import { systemSettingsTable } from "./schema/system"
import { auditLogsTable } from "./schema/audit"
import { releaseAnnouncementsTable, releaseAnnouncementViewsTable } from "./schema/release"

const globalForDb = globalThis as typeof globalThis & {
  pool?: Pool
}

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const schema = {
  user: usersTable,
  session: sessionsTable,
  account: accountsTable,
  verification: verificationTokensTable,
  books: booksTable,
  notifications: notificationsTable,
  readingReminderEvents: readingReminderEventsTable,
  tags: tagsTable,
  bookTags: bookTagsTable,
  collections: collectionsTable,
  collectionBooks: collectionBooksTable,
  sharedCollectionMembers: sharedCollectionMembersTable,
  readingGoals: readingGoalsTable,
  recommendationFeedback: recommendationFeedbackTable,
  readingSessions: readingSessionsTable,
  bookHighlights: bookHighlightsTable,
  bookProgressEvents: bookProgressEventsTable,
  systemSettings: systemSettingsTable,
  auditLogs: auditLogsTable,
  releaseAnnouncements: releaseAnnouncementsTable,
  releaseAnnouncementViews: releaseAnnouncementViewsTable,
} as const

export const db = drizzle(pool, { schema })

