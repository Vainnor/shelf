CREATE TABLE IF NOT EXISTS "release_announcements" (
  "id" text PRIMARY KEY NOT NULL,
  "version_key" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "release_link" text,
  "image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "release_announcement_views" (
  "id" text PRIMARY KEY NOT NULL,
  "release_announcement_id" text NOT NULL,
  "user_id" text NOT NULL,
  "viewed_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'release_announcement_views_release_announcement_id_release_announcements_id_fk'
  ) THEN
    ALTER TABLE "release_announcement_views"
      ADD CONSTRAINT "release_announcement_views_release_announcement_id_release_announcements_id_fk"
      FOREIGN KEY ("release_announcement_id")
      REFERENCES "public"."release_announcements"("id")
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
    WHERE conname = 'release_announcement_views_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "release_announcement_views"
      ADD CONSTRAINT "release_announcement_views_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "release_announcements_version_key_idx"
  ON "release_announcements" USING btree ("version_key");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "release_announcements_active_created_idx"
  ON "release_announcements" USING btree ("is_active", "created_at");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "release_announcement_views_release_user_idx"
  ON "release_announcement_views" USING btree ("release_announcement_id", "user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "release_announcement_views_user_viewed_idx"
  ON "release_announcement_views" USING btree ("user_id", "viewed_at");

