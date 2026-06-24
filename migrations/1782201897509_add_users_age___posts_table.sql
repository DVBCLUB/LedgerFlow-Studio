-- UP
CREATE TABLE "posts" (
  "id" integer PRIMARY KEY,
  "title" text NOT NULL,
  "user_id" integer
);

ALTER TABLE "users" ADD COLUMN "age" integer;

ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user';

-- DOWN
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

ALTER TABLE "users" DROP COLUMN IF EXISTS "age";

DROP TABLE IF EXISTS "posts";