ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "public_show_highlights" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "public_highlights_limit" integer DEFAULT 3 NOT NULL;
--> statement-breakpoint

UPDATE "users"
SET "public_highlights_limit" = 3
WHERE "public_highlights_limit" < 1;

