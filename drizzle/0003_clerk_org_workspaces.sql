ALTER TABLE "workspaces" ADD COLUMN "clerk_org_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_clerk_org_id_unique" ON "workspaces" USING btree ("clerk_org_id");--> statement-breakpoint
