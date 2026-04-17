import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { usersTable } from "./user"

export const releaseAnnouncementsTable = pgTable(
  "release_announcements",
  {
    id: text("id").primaryKey(),
    versionKey: text("version_key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    releaseLink: text("release_link"),
    imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    versionKeyIdx: uniqueIndex("release_announcements_version_key_idx").on(table.versionKey),
    activeCreatedIdx: index("release_announcements_active_created_idx").on(table.isActive, table.createdAt),
  })
)

export const releaseAnnouncementViewsTable = pgTable(
  "release_announcement_views",
  {
    id: text("id").primaryKey(),
    releaseAnnouncementId: text("release_announcement_id")
      .notNull()
      .references(() => releaseAnnouncementsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    releaseUserIdx: uniqueIndex("release_announcement_views_release_user_idx").on(
      table.releaseAnnouncementId,
      table.userId
    ),
    userViewedIdx: index("release_announcement_views_user_viewed_idx").on(table.userId, table.viewedAt),
  })
)

