CREATE TABLE IF NOT EXISTS "subscriptions" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "plan" varchar(20) NOT NULL DEFAULT 'free',
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "current_period_end" timestamp,
  "imports_this_month" integer NOT NULL DEFAULT 0,
  "imports_reset_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
