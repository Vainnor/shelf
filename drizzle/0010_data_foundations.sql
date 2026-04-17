DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reading_reminder_event_type') THEN
    CREATE TYPE "reading_reminder_event_type" AS ENUM ('sent', 'snoozed', 'dismissed', 'acted');
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_feedback_type') THEN
    CREATE TYPE "recommendation_feedback_type" AS ENUM ('not_interested', 'already_read');
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "manual_rank" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "last_reminded_at" timestamp;
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "snoozed_until" timestamp;
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "reminder_dismissed_at" timestamp;
--> statement-breakpoint

ALTER TABLE "reading_goals" ADD COLUMN IF NOT EXISTS "yearly_target" integer;
--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN IF NOT EXISTS "monthly_target" integer;
--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN IF NOT EXISTS "target_year" integer;
--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN IF NOT EXISTS "target_month" integer;
--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN IF NOT EXISTS "pacing_updated_at" timestamp;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "reading_reminder_events" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "book_id" text NOT NULL,
  "event_type" "reading_reminder_event_type" NOT NULL,
  "details" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "source_book_id" text,
  "recommendation_key" text NOT NULL,
  "feedback_type" "recommendation_feedback_type" NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reading_reminder_events_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "reading_reminder_events"
      ADD CONSTRAINT "reading_reminder_events_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reading_reminder_events_book_id_books_id_fk'
  ) THEN
    ALTER TABLE "reading_reminder_events"
      ADD CONSTRAINT "reading_reminder_events_book_id_books_id_fk"
      FOREIGN KEY ("book_id")
      REFERENCES "public"."books"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recommendation_feedback_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "recommendation_feedback"
      ADD CONSTRAINT "recommendation_feedback_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recommendation_feedback_source_book_id_books_id_fk'
  ) THEN
    ALTER TABLE "recommendation_feedback"
      ADD CONSTRAINT "recommendation_feedback_source_book_id_books_id_fk"
      FOREIGN KEY ("source_book_id")
      REFERENCES "public"."books"("id")
      ON DELETE set null
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "books_user_status_manual_rank_idx"
  ON "books" USING btree ("user_id", "status", "manual_rank", "updated_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "books_user_snoozed_until_idx"
  ON "books" USING btree ("user_id", "snoozed_until");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "books_user_reminder_dismissed_idx"
  ON "books" USING btree ("user_id", "reminder_dismissed_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "reading_reminder_events_user_created_idx"
  ON "reading_reminder_events" USING btree ("user_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "reading_reminder_events_book_created_idx"
  ON "reading_reminder_events" USING btree ("book_id", "created_at");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "recommendation_feedback_user_source_type_idx"
  ON "recommendation_feedback" USING btree ("user_id", "source_book_id", "feedback_type");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "recommendation_feedback_user_key_type_idx"
  ON "recommendation_feedback" USING btree ("user_id", "recommendation_key", "feedback_type");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "recommendation_feedback_user_updated_idx"
  ON "recommendation_feedback" USING btree ("user_id", "updated_at");
--> statement-breakpoint

WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id, status ORDER BY updated_at DESC, created_at DESC, id ASC) - 1 AS rank
  FROM books
)
UPDATE books b
SET manual_rank = ranked.rank
FROM ranked
WHERE b.id = ranked.id
  AND (b.manual_rank IS NULL OR b.manual_rank = 0);

