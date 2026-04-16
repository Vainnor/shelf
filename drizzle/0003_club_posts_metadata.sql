ALTER TABLE "book_club_posts" ADD COLUMN "title" text;--> statement-breakpoint
UPDATE "book_club_posts"
SET "title" = CASE
  WHEN char_length(trim(coalesce("body", ''))) = 0 THEN 'Untitled post'
  ELSE left(trim("body"), 80)
END
WHERE "title" IS NULL;--> statement-breakpoint
ALTER TABLE "book_club_posts" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "book_club_posts" ADD COLUMN "is_announcement" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "book_club_posts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "book_club_posts" SET "updated_at" = "created_at";--> statement-breakpoint
ALTER TABLE "book_club_posts" ADD COLUMN "edited_at" timestamp;--> statement-breakpoint
CREATE INDEX "book_club_posts_club_announcement_idx" ON "book_club_posts" USING btree ("club_id","is_announcement");
