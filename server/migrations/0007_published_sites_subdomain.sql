ALTER TABLE "published_sites" ADD COLUMN IF NOT EXISTS "subdomain" varchar(63);
CREATE UNIQUE INDEX IF NOT EXISTS "published_sites_subdomain_idx"
  ON "published_sites" ("subdomain") WHERE "subdomain" IS NOT NULL;
