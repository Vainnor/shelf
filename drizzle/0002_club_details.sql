CREATE TYPE "public"."book_club_invite_status" AS ENUM('pending', 'accepted', 'declined', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."club_shelf_status" AS ENUM('to_read', 'reading', 'read');--> statement-breakpoint
CREATE TYPE "public"."book_club_activity_type" AS ENUM('club_created', 'member_joined', 'member_left', 'invite_sent', 'invite_accepted', 'invite_declined', 'invite_revoked', 'member_role_changed', 'member_removed', 'book_added', 'book_removed', 'discussion_posted');--> statement-breakpoint
CREATE TABLE "book_club_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"inviter_user_id" text NOT NULL,
	"invited_user_id" text NOT NULL,
	"role" "book_club_role" DEFAULT 'member' NOT NULL,
	"status" "book_club_invite_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_club_books" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"added_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"cover_url" text,
	"notes" text,
	"status" "club_shelf_status" DEFAULT 'to_read' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_club_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_club_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"activity_type" "book_club_activity_type" NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_club_invites" ADD CONSTRAINT "book_club_invites_club_id_book_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."book_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_invites" ADD CONSTRAINT "book_club_invites_inviter_user_id_users_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_invites" ADD CONSTRAINT "book_club_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_books" ADD CONSTRAINT "book_club_books_club_id_book_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."book_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_books" ADD CONSTRAINT "book_club_books_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_posts" ADD CONSTRAINT "book_club_posts_club_id_book_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."book_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_posts" ADD CONSTRAINT "book_club_posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_activity" ADD CONSTRAINT "book_club_activity_club_id_book_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."book_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_activity" ADD CONSTRAINT "book_club_activity_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_club_invites_pending_idx" ON "book_club_invites" USING btree ("club_id","invited_user_id","status");--> statement-breakpoint
CREATE INDEX "book_club_invites_invited_user_idx" ON "book_club_invites" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "book_club_books_club_updated_idx" ON "book_club_books" USING btree ("club_id","updated_at");--> statement-breakpoint
CREATE INDEX "book_club_posts_club_created_idx" ON "book_club_posts" USING btree ("club_id","created_at");--> statement-breakpoint
CREATE INDEX "book_club_activity_club_created_idx" ON "book_club_activity" USING btree ("club_id","created_at");
