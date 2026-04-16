CREATE TABLE IF NOT EXISTS "book_highlights" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "book_id" text NOT NULL,
  "quote" text NOT NULL,
  "page" integer,
  "highlighted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'book_highlights_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "book_highlights"
      ADD CONSTRAINT "book_highlights_user_id_users_id_fk"
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
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'book_highlights_book_id_books_id_fk'
  ) THEN
    ALTER TABLE "book_highlights"
      ADD CONSTRAINT "book_highlights_book_id_books_id_fk"
      FOREIGN KEY ("book_id")
      REFERENCES "public"."books"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "book_highlights_user_book_created_idx"
  ON "book_highlights" USING btree ("user_id", "book_id", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "book_highlights_book_highlighted_at_idx"
  ON "book_highlights" USING btree ("book_id", "highlighted_at");

