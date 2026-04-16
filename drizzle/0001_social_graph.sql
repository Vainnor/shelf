CREATE TYPE "public"."book_club_role" AS ENUM('owner', 'moderator', 'member');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_profile_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "follows" (
	"id" text PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_clubs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_club_members" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "book_club_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_collection_members" (
	"id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"user_id" text NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_clubs" ADD CONSTRAINT "book_clubs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_members" ADD CONSTRAINT "book_club_members_club_id_book_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."book_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_club_members" ADD CONSTRAINT "book_club_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_collection_members" ADD CONSTRAINT "shared_collection_members_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_collection_members" ADD CONSTRAINT "shared_collection_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_follower_following_idx" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "follows_follower_idx" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "book_clubs_owner_idx" ON "book_clubs" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "book_clubs_public_idx" ON "book_clubs" USING btree ("is_public");--> statement-breakpoint
CREATE UNIQUE INDEX "book_club_members_club_user_idx" ON "book_club_members" USING btree ("club_id","user_id");--> statement-breakpoint
CREATE INDEX "book_club_members_user_idx" ON "book_club_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_collection_members_collection_user_idx" ON "shared_collection_members" USING btree ("collection_id","user_id");--> statement-breakpoint
CREATE INDEX "shared_collection_members_user_idx" ON "shared_collection_members" USING btree ("user_id");
