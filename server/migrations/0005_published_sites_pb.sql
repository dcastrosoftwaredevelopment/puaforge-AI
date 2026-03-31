ALTER TABLE "published_sites" DROP COLUMN IF EXISTS "html";
ALTER TABLE "published_sites" ADD COLUMN IF NOT EXISTS "pb_record_id" varchar(255) NOT NULL DEFAULT '';
