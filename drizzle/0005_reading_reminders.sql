ALTER TABLE "users" ADD COLUMN "reading_reminder_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reading_reminder_channel" text DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reading_reminder_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
UPDATE "users"
SET "reading_reminder_channel" = 'email'
WHERE "reading_reminder_channel" NOT IN ('email', 'push');--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reading_reminder_days_positive" CHECK ("reading_reminder_days" >= 1);

