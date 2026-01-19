CREATE TABLE IF NOT EXISTS "chat_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"provider" text NOT NULL,
	"input_price" integer DEFAULT 0 NOT NULL,
	"output_price" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prompt_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" json,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_thread" ADD COLUMN IF NOT EXISTS "team_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD COLUMN IF NOT EXISTS "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "is_group_chat" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD COLUMN IF NOT EXISTS "cost" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "chat_folder" DROP CONSTRAINT IF EXISTS "chat_folder_user_id_user_id_fk";
ALTER TABLE "chat_folder" ADD CONSTRAINT "chat_folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_library" DROP CONSTRAINT IF EXISTS "prompt_library_user_id_user_id_fk";
ALTER TABLE "prompt_library" ADD CONSTRAINT "prompt_library_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread" DROP CONSTRAINT IF EXISTS "chat_thread_team_id_team_id_fk";
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread" DROP CONSTRAINT IF EXISTS "chat_thread_folder_id_chat_folder_id_fk";
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_folder_id_chat_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."chat_folder"("id") ON DELETE set null ON UPDATE no action;