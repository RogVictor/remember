import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_chat_sessions_status" AS ENUM('new', 'active', 'closed');
  CREATE TYPE "public"."enum_chat_messages_author" AS ENUM('visitor', 'operator');
  CREATE TABLE "chat_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"status" "enum_chat_sessions_status" DEFAULT 'new' NOT NULL,
  	"name" varchar,
  	"phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "chat_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer NOT NULL,
  	"author" "enum_chat_messages_author" NOT NULL,
  	"text" varchar NOT NULL,
  	"client_key" varchar,
  	"telegram_group" varchar,
  	"telegram_message" numeric,
  	"telegram_update" numeric,
  	"retry_at" timestamp(3) with time zone,
  	"attempts" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "chat_sessions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "chat_messages_id" integer;
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "chat_sessions_token_hash_idx" ON "chat_sessions" USING btree ("token_hash");
  CREATE INDEX "chat_sessions_updated_at_idx" ON "chat_sessions" USING btree ("updated_at");
  CREATE INDEX "chat_sessions_created_at_idx" ON "chat_sessions" USING btree ("created_at");
  CREATE INDEX "chat_messages_session_idx" ON "chat_messages" USING btree ("session_id");
  CREATE UNIQUE INDEX "chat_messages_telegram_update_idx" ON "chat_messages" USING btree ("telegram_update");
  CREATE INDEX "chat_messages_retry_at_idx" ON "chat_messages" USING btree ("retry_at");
  CREATE INDEX "chat_messages_updated_at_idx" ON "chat_messages" USING btree ("updated_at");
  CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");
  CREATE UNIQUE INDEX "session_clientKey_idx" ON "chat_messages" USING btree ("session_id","client_key");
  CREATE UNIQUE INDEX "telegramGroup_telegramMessage_idx" ON "chat_messages" USING btree ("telegram_group","telegram_message");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_sessions_fk" FOREIGN KEY ("chat_sessions_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_chat_messages_fk" FOREIGN KEY ("chat_messages_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_chat_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("chat_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_chat_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("chat_messages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "chat_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "chat_sessions" CASCADE;
  DROP TABLE "chat_messages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_chat_sessions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_chat_messages_fk";
  
  DROP INDEX "payload_locked_documents_rels_chat_sessions_id_idx";
  DROP INDEX "payload_locked_documents_rels_chat_messages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "chat_sessions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "chat_messages_id";
  DROP TYPE "public"."enum_chat_sessions_status";
  DROP TYPE "public"."enum_chat_messages_author";`)
}
