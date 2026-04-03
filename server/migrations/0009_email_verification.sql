ALTER TABLE "users"
  ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false,
  ADD COLUMN "email_verification_token" varchar(255) UNIQUE,
  ADD COLUMN "email_verification_expiry" timestamp;

-- Existing users are considered verified so they don't need to re-verify
UPDATE "users" SET "email_verified" = true;
