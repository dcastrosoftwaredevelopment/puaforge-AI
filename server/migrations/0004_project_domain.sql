ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "custom_domain" varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS "projects_custom_domain_idx" ON "projects" ("custom_domain") WHERE "custom_domain" IS NOT NULL;
