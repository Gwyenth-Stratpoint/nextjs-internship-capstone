DO $$
BEGIN
  CREATE TYPE "public"."list_category" AS ENUM('todo', 'in_progress', 'done');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN IF NOT EXISTS "category" "list_category" DEFAULT 'todo' NOT NULL;
--> statement-breakpoint
UPDATE "lists"
SET "category" = 'in_progress'::"list_category"
WHERE "name" = 'In Progress' AND "category" = 'todo'::"list_category";
--> statement-breakpoint
UPDATE "lists"
SET "category" = 'done'::"list_category"
WHERE "name" = 'Done' AND "category" = 'todo'::"list_category";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lists'
      AND column_name = 'is_start'
  ) THEN
    EXECUTE 'UPDATE "lists" SET "category" = ''todo''::"list_category" WHERE "is_start" = true';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lists'
      AND column_name = 'is_end'
  ) THEN
    EXECUTE 'UPDATE "lists" SET "category" = ''done''::"list_category" WHERE "is_end" = true';
  END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "lists" DROP COLUMN IF EXISTS "is_start";
--> statement-breakpoint
ALTER TABLE "lists" DROP COLUMN IF EXISTS "is_end";
