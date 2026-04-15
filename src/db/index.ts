import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
} from "./schema/user"
import { booksTable } from "./schema/book"
import { systemSettingsTable } from "./schema/system"

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
  systemSettings: systemSettingsTable,
} as const

export const db = drizzle(pool, { schema })

