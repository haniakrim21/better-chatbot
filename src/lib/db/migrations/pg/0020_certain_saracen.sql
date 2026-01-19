ALTER TABLE "chat_message" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;