import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { booksTable, bookStatusEnum } from "./book"
import { usersTable } from "./user"

export const progressEventTypes = [
  "page_update",
  "status_change",
  "session_logged",
  "rating_updated",
  "review_updated",
] as const

export const progressEventTypeEnum = pgEnum("progress_event_type", progressEventTypes)
export const bookClubRoleEnum = pgEnum("book_club_role", ["owner", "moderator", "member"])

export const tagsTable = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userNameIdx: uniqueIndex("tags_user_name_idx").on(table.userId, table.name),
  })
)

export const bookTagsTable = pgTable(
  "book_tags",
  {
    id: text("id").primaryKey(),
    bookId: text("book_id")
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBookTagIdx: uniqueIndex("book_tags_book_tag_idx").on(table.bookId, table.tagId),
    tagIdx: index("book_tags_tag_idx").on(table.tagId),
  })
)

export const collectionsTable = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userNameIdx: uniqueIndex("collections_user_name_idx").on(table.userId, table.name),
  })
)

export const collectionBooksTable = pgTable(
  "collection_books",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    position: integer("position"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueCollectionBookIdx: uniqueIndex("collection_books_collection_book_idx").on(
      table.collectionId,
      table.bookId
    ),
    collectionIdx: index("collection_books_collection_idx").on(table.collectionId),
  })
)

export const followsTable = pgTable(
  "follows",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    followerFollowingIdx: uniqueIndex("follows_follower_following_idx").on(
      table.followerId,
      table.followingId
    ),
    followerIdx: index("follows_follower_idx").on(table.followerId),
    followingIdx: index("follows_following_idx").on(table.followingId),
  })
)

export const bookClubsTable = pgTable(
  "book_clubs",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdx: index("book_clubs_owner_idx").on(table.ownerId),
    publicIdx: index("book_clubs_public_idx").on(table.isPublic),
  })
)

export const bookClubMembersTable = pgTable(
  "book_club_members",
  {
    id: text("id").primaryKey(),
    clubId: text("club_id")
      .notNull()
      .references(() => bookClubsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: bookClubRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueClubMemberIdx: uniqueIndex("book_club_members_club_user_idx").on(table.clubId, table.userId),
    userIdx: index("book_club_members_user_idx").on(table.userId),
  })
)

export const sharedCollectionMembersTable = pgTable(
  "shared_collection_members",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collectionsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    canEdit: boolean("can_edit").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueCollectionMemberIdx: uniqueIndex("shared_collection_members_collection_user_idx").on(
      table.collectionId,
      table.userId
    ),
    userIdx: index("shared_collection_members_user_idx").on(table.userId),
  })
)

export const readingGoalsTable = pgTable("reading_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  pagesPerDay: integer("pages_per_day").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const readingSessionsTable = pgTable(
  "reading_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
    durationMinutes: integer("duration_minutes").notNull(),
    pagesRead: integer("pages_read").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userStartedIdx: index("reading_sessions_user_started_idx").on(table.userId, table.startedAt),
    bookStartedIdx: index("reading_sessions_book_started_idx").on(table.bookId, table.startedAt),
  })
)

export const bookProgressEventsTable = pgTable(
  "book_progress_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    eventType: progressEventTypeEnum("event_type").notNull(),
    fromPage: integer("from_page"),
    toPage: integer("to_page"),
    fromStatus: bookStatusEnum("from_status"),
    toStatus: bookStatusEnum("to_status"),
    rating: integer("rating"),
    review: text("review"),
    details: text("details"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("book_progress_events_user_created_idx").on(table.userId, table.createdAt),
    bookCreatedIdx: index("book_progress_events_book_created_idx").on(table.bookId, table.createdAt),
  })
)

