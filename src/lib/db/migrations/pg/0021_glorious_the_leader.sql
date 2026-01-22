CREATE TABLE "platform_api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "platform_api_key_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
ALTER TABLE "platform_api_key" ADD CONSTRAINT "platform_api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_api_key" ADD CONSTRAINT "platform_api_key_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;