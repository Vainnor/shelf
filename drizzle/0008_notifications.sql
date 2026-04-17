CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" text DEFAULT 'info' NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "href" text,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_user_read_created_idx"
  ON "notifications" USING btree ("user_id", "is_read", "created_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_user_created_idx"
  ON "notifications" USING btree ("user_id", "created_at");

