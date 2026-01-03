ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "tags" json;--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "usage_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN IF NOT EXISTS "is_folder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD COLUMN IF NOT EXISTS "team_id" uuid;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD COLUMN IF NOT EXISTS "tags" json;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD COLUMN IF NOT EXISTS "usage_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "tags" json;--> statement-breakpoint
ALTER TABLE "workflow" ADD COLUMN IF NOT EXISTS "team_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflow" ADD CONSTRAINT "workflow_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;