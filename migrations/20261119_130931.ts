import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_info_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__info_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "info_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"summary" varchar,
  	"page_id" integer,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_info_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_info_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_page_id" integer,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__info_articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "info_articles_id" integer;
  ALTER TABLE "info_articles" ADD CONSTRAINT "info_articles_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_info_articles_v" ADD CONSTRAINT "_info_articles_v_parent_id_info_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."info_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_info_articles_v" ADD CONSTRAINT "_info_articles_v_version_page_id_pages_id_fk" FOREIGN KEY ("version_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "info_articles_page_idx" ON "info_articles" USING btree ("page_id");
  CREATE INDEX "info_articles_updated_at_idx" ON "info_articles" USING btree ("updated_at");
  CREATE INDEX "info_articles_created_at_idx" ON "info_articles" USING btree ("created_at");
  CREATE INDEX "info_articles__status_idx" ON "info_articles" USING btree ("_status");
  CREATE INDEX "_info_articles_v_parent_idx" ON "_info_articles_v" USING btree ("parent_id");
  CREATE INDEX "_info_articles_v_version_version_page_idx" ON "_info_articles_v" USING btree ("version_page_id");
  CREATE INDEX "_info_articles_v_version_version_updated_at_idx" ON "_info_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_info_articles_v_version_version_created_at_idx" ON "_info_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_info_articles_v_version_version__status_idx" ON "_info_articles_v" USING btree ("version__status");
  CREATE INDEX "_info_articles_v_created_at_idx" ON "_info_articles_v" USING btree ("created_at");
  CREATE INDEX "_info_articles_v_updated_at_idx" ON "_info_articles_v" USING btree ("updated_at");
  CREATE INDEX "_info_articles_v_latest_idx" ON "_info_articles_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_info_articles_fk" FOREIGN KEY ("info_articles_id") REFERENCES "public"."info_articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_info_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("info_articles_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "info_articles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_info_articles_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "info_articles" CASCADE;
  DROP TABLE "_info_articles_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_info_articles_fk";
  
  DROP INDEX "payload_locked_documents_rels_info_articles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "info_articles_id";
  DROP TYPE "public"."enum_info_articles_status";
  DROP TYPE "public"."enum__info_articles_v_version_status";`)
}
