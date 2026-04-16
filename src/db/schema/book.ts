import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { usersTable } from "./user"

export const bookStatuses = ["to_read", "reading", "read"] as const

export const bookStatusEnum = pgEnum("book_status", bookStatuses)

export const booksTable = pgTable(
  "books",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    author: text("author").notNull(),
    totalPages: integer("total_pages"),
    currentPage: integer("current_page").notNull().default(0),
    status: bookStatusEnum("status").notNull().default("to_read"),
    isbn: text("isbn"),
    coverUrl: text("cover_url"),
    notes: text("notes"),
    rating: integer("rating"),
    review: text("review"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    dailyPageGoal: integer("daily_page_goal"),
    targetFinishDate: timestamp("target_finish_date", { mode: "date" }),
    startedAt: timestamp("started_at", { mode: "date" }),
    finishedAt: timestamp("finished_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userStatusIdx: index("books_user_status_idx").on(table.userId, table.status),
    userCreatedIdx: index("books_user_created_idx").on(table.userId, table.createdAt),
    isbnIdx: index("books_isbn_idx").on(table.isbn),
    favoriteIdx: index("books_favorite_idx").on(table.userId, table.isFavorite),
    ratingIdx: index("books_rating_idx").on(table.userId, table.rating),
  })
)


