ALTER TABLE "platform_api_key" ADD COLUMN "scopes" text[];--> statement-breakpoint
ALTER TABLE "platform_api_key" ADD COLUMN "expires_at" timestamp;