CREATE TYPE "public"."list_category" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "category" "list_category" DEFAULT 'todo' NOT NULL;