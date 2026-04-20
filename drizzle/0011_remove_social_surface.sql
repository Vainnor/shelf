DROP TABLE IF EXISTS "book_club_activity" CASCADE;
DROP TABLE IF EXISTS "book_club_posts" CASCADE;
DROP TABLE IF EXISTS "book_club_books" CASCADE;
DROP TABLE IF EXISTS "book_club_invites" CASCADE;
DROP TABLE IF EXISTS "book_club_members" CASCADE;
DROP TABLE IF EXISTS "book_clubs" CASCADE;
DROP TABLE IF EXISTS "follows" CASCADE;

DROP INDEX IF EXISTS "users_username_unique";

ALTER TABLE "users" DROP COLUMN IF EXISTS "public_highlights_limit";
ALTER TABLE "users" DROP COLUMN IF EXISTS "public_show_highlights";
ALTER TABLE "users" DROP COLUMN IF EXISTS "public_profile_enabled";
ALTER TABLE "users" DROP COLUMN IF EXISTS "username";

DROP TYPE IF EXISTS "public"."book_club_activity_type";
DROP TYPE IF EXISTS "public"."book_club_invite_status";
DROP TYPE IF EXISTS "public"."club_shelf_status";
DROP TYPE IF EXISTS "public"."book_club_role";

