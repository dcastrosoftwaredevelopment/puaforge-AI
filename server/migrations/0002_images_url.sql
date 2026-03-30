ALTER TABLE "project_images" DROP COLUMN IF EXISTS "data";
ALTER TABLE "project_images" ADD COLUMN "url" text NOT NULL DEFAULT '';
ALTER TABLE "project_images" ALTER COLUMN "url" DROP DEFAULT;
