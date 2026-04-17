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
export const bookClubInviteStatusEnum = pgEnum("book_club_invite_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
])
export const clubShelfStatusEnum = pgEnum("club_shelf_status", ["to_read", "reading", "read"])
export const bookClubActivityTypeEnum = pgEnum("book_club_activity_type", [
  "club_created",
  "member_joined",
  "member_left",
  "invite_sent",
  "invite_accepted",
  "invite_declined",
  "invite_revoked",
  "member_role_changed",
  "member_removed",
  "book_added",
  "book_removed",
  "discussion_posted",
])
export const reminderEventTypes = ["sent", "snoozed", "dismissed", "acted"] as const
export const reminderEventTypeEnum = pgEnum("reading_reminder_event_type", reminderEventTypes)
export const recommendationFeedbackTypes = ["not_interested", "already_read"] as const
export const recommendationFeedbackTypeEnum = pgEnum(
  "recommendation_feedback_type",
  recommendationFeedbackTypes
)

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

export const notificationsTable = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userReadCreatedIdx: index("notifications_user_read_created_idx").on(
      table.userId,
      table.isRead,
      table.createdAt
    ),
    userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
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

export const bookClubInvitesTable = pgTable(
  "book_club_invites",
  {
    id: text("id").primaryKey(),
    clubId: text("club_id")
      .notNull()
      .references(() => bookClubsTable.id, { onDelete: "cascade" }),
    inviterUserId: text("inviter_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    invitedUserId: text("invited_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: bookClubRoleEnum("role").notNull().default("member"),
    status: bookClubInviteStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    pendingInviteIdx: uniqueIndex("book_club_invites_pending_idx").on(
      table.clubId,
      table.invitedUserId,
      table.status
    ),
    invitedUserIdx: index("book_club_invites_invited_user_idx").on(table.invitedUserId),
  })
)

export const bookClubBooksTable = pgTable(
  "book_club_books",
  {
    id: text("id").primaryKey(),
    clubId: text("club_id")
      .notNull()
      .references(() => bookClubsTable.id, { onDelete: "cascade" }),
    addedByUserId: text("added_by_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    author: text("author").notNull(),
    coverUrl: text("cover_url"),
    notes: text("notes"),
    status: clubShelfStatusEnum("status").notNull().default("to_read"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    clubUpdatedIdx: index("book_club_books_club_updated_idx").on(table.clubId, table.updatedAt),
  })
)

export const bookClubPostsTable = pgTable(
  "book_club_posts",
  {
    id: text("id").primaryKey(),
    clubId: text("club_id")
      .notNull()
      .references(() => bookClubsTable.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    isAnnouncement: boolean("is_announcement").notNull().default(false),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    clubCreatedIdx: index("book_club_posts_club_created_idx").on(table.clubId, table.createdAt),
    clubAnnouncementIdx: index("book_club_posts_club_announcement_idx").on(
      table.clubId,
      table.isAnnouncement
    ),
  })
)

export const bookClubActivityTable = pgTable(
  "book_club_activity",
  {
    id: text("id").primaryKey(),
    clubId: text("club_id")
      .notNull()
      .references(() => bookClubsTable.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    activityType: bookClubActivityTypeEnum("activity_type").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    clubCreatedIdx: index("book_club_activity_club_created_idx").on(table.clubId, table.createdAt),
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
  yearlyTarget: integer("yearly_target"),
  monthlyTarget: integer("monthly_target"),
  targetYear: integer("target_year"),
  targetMonth: integer("target_month"),
  pacingUpdatedAt: timestamp("pacing_updated_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const readingReminderEventsTable = pgTable(
  "reading_reminder_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    eventType: reminderEventTypeEnum("event_type").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("reading_reminder_events_user_created_idx").on(table.userId, table.createdAt),
    bookCreatedIdx: index("reading_reminder_events_book_created_idx").on(table.bookId, table.createdAt),
  })
)

export const recommendationFeedbackTable = pgTable(
  "recommendation_feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sourceBookId: text("source_book_id").references(() => booksTable.id, { onDelete: "set null" }),
    recommendationKey: text("recommendation_key").notNull(),
    feedbackType: recommendationFeedbackTypeEnum("feedback_type").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserSourceFeedbackIdx: uniqueIndex("recommendation_feedback_user_source_type_idx").on(
      table.userId,
      table.sourceBookId,
      table.feedbackType
    ),
    uniqueUserRecommendationFeedbackIdx: uniqueIndex("recommendation_feedback_user_key_type_idx").on(
      table.userId,
      table.recommendationKey,
      table.feedbackType
    ),
    userUpdatedIdx: index("recommendation_feedback_user_updated_idx").on(table.userId, table.updatedAt),
  })
)

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

export const bookHighlightsTable = pgTable(
  "book_highlights",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bookId: text("book_id")
      .notNull()
      .references(() => booksTable.id, { onDelete: "cascade" }),
    quote: text("quote").notNull(),
    page: integer("page"),
    highlightedAt: timestamp("highlighted_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userBookCreatedIdx: index("book_highlights_user_book_created_idx").on(
      table.userId,
      table.bookId,
      table.createdAt
    ),
    bookHighlightedAtIdx: index("book_highlights_book_highlighted_at_idx").on(
      table.bookId,
      table.highlightedAt
    ),
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

