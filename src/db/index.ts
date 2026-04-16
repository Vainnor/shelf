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
  bookClubActivityTable,
  bookClubBooksTable,
  bookClubMembersTable,
  bookClubInvitesTable,
  bookClubsTable,
  bookHighlightsTable,
  bookProgressEventsTable,
  bookClubPostsTable,
  bookTagsTable,
  collectionBooksTable,
  collectionsTable,
  followsTable,
  readingGoalsTable,
  readingSessionsTable,
  sharedCollectionMembersTable,
  tagsTable,
} from "./schema/reading"
import { systemSettingsTable } from "./schema/system"
import { auditLogsTable } from "./schema/audit"

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
  tags: tagsTable,
  bookTags: bookTagsTable,
  collections: collectionsTable,
  collectionBooks: collectionBooksTable,
  follows: followsTable,
  bookClubs: bookClubsTable,
  bookClubMembers: bookClubMembersTable,
  bookClubInvites: bookClubInvitesTable,
  bookClubBooks: bookClubBooksTable,
  bookClubPosts: bookClubPostsTable,
  bookClubActivity: bookClubActivityTable,
  sharedCollectionMembers: sharedCollectionMembersTable,
  readingGoals: readingGoalsTable,
  readingSessions: readingSessionsTable,
  bookHighlights: bookHighlightsTable,
  bookProgressEvents: bookProgressEventsTable,
  systemSettings: systemSettingsTable,
  auditLogs: auditLogsTable,
} as const

export const db = drizzle(pool, { schema })

