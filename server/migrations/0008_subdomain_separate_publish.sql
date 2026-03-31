ALTER TABLE "published_sites" ADD COLUMN IF NOT EXISTS "subdomain_pb_record_id" varchar(255);
ALTER TABLE "published_sites" ADD COLUMN IF NOT EXISTS "subdomain_published_at" timestamp;
