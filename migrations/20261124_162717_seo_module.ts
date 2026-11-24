import { sql, type MigrateUpArgs, type MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_search_intent" AS ENUM('commercial', 'informational', 'transactional', 'navigational', 'mixed');
  CREATE TYPE "public"."enum_pages_schema_type" AS ENUM('auto', 'WebPage', 'Service', 'OfferCatalog', 'Article', 'FAQPage');
  CREATE TYPE "public"."enum__pages_v_version_search_intent" AS ENUM('commercial', 'informational', 'transactional', 'navigational', 'mixed');
  CREATE TYPE "public"."enum__pages_v_version_schema_type" AS ENUM('auto', 'WebPage', 'Service', 'OfferCatalog', 'Article', 'FAQPage');
  CREATE TYPE "public"."enum_site_seo_route" AS ENUM('/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal');
  CREATE TYPE "public"."enum_site_seo_search_intent" AS ENUM('commercial', 'informational', 'transactional', 'navigational', 'mixed');
  CREATE TYPE "public"."enum_site_seo_schema_type" AS ENUM('auto', 'WebPage', 'Service', 'OfferCatalog', 'Article', 'FAQPage');
  CREATE TYPE "public"."enum_site_seo_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_seo_v_version_route" AS ENUM('/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal');
  CREATE TYPE "public"."enum__site_seo_v_version_search_intent" AS ENUM('commercial', 'informational', 'transactional', 'navigational', 'mixed');
  CREATE TYPE "public"."enum__site_seo_v_version_schema_type" AS ENUM('auto', 'WebPage', 'Service', 'OfferCatalog', 'Article', 'FAQPage');
  CREATE TYPE "public"."enum__site_seo_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_company_settings_schema_organization_type" AS ENUM('Organization', 'FuneralHome');
  CREATE TABLE "pages_secondary_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar
  );
  
  CREATE TABLE "pages_related_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar
  );
  
  CREATE TABLE "pages_target_regions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" varchar
  );
  
  CREATE TABLE "_pages_v_version_secondary_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_related_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_target_regions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "site_seo_secondary_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar
  );
  
  CREATE TABLE "site_seo_related_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar
  );
  
  CREATE TABLE "site_seo_target_regions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" varchar
  );
  
  CREATE TABLE "site_seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"route" "enum_site_seo_route",
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"og_image_id" integer,
  	"focus_keyword" varchar,
  	"focus_keyword_key" varchar,
  	"search_intent" "enum_site_seo_search_intent",
  	"seo_notes" varchar,
  	"open_graph_title" varchar,
  	"open_graph_description" varchar,
  	"open_graph_image_id" integer,
  	"canonical_override" varchar,
  	"robots_index" boolean DEFAULT true,
  	"robots_follow" boolean DEFAULT true,
  	"schema_type" "enum_site_seo_schema_type" DEFAULT 'auto',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_site_seo_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_site_seo_v_version_secondary_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_version_related_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_version_target_regions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"region" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_route" "enum__site_seo_v_version_route",
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_og_image_id" integer,
  	"version_focus_keyword" varchar,
  	"version_focus_keyword_key" varchar,
  	"version_search_intent" "enum__site_seo_v_version_search_intent",
  	"version_seo_notes" varchar,
  	"version_open_graph_title" varchar,
  	"version_open_graph_description" varchar,
  	"version_open_graph_image_id" integer,
  	"version_canonical_override" varchar,
  	"version_robots_index" boolean DEFAULT true,
  	"version_robots_follow" boolean DEFAULT true,
  	"version_schema_type" "enum__site_seo_v_version_schema_type" DEFAULT 'auto',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__site_seo_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "company_settings_service_regions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"region" varchar NOT NULL
  );
  
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "focus_keyword" varchar;
  ALTER TABLE "pages" ADD COLUMN "focus_keyword_key" varchar;
  ALTER TABLE "pages" ADD COLUMN "search_intent" "enum_pages_search_intent";
  ALTER TABLE "pages" ADD COLUMN "seo_notes" varchar;
  ALTER TABLE "pages" ADD COLUMN "open_graph_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "open_graph_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "open_graph_image_id" integer;
  ALTER TABLE "pages" ADD COLUMN "canonical_override" varchar;
  ALTER TABLE "pages" ADD COLUMN "robots_index" boolean DEFAULT true;
  ALTER TABLE "pages" ADD COLUMN "robots_follow" boolean DEFAULT true;
  ALTER TABLE "pages" ADD COLUMN "schema_type" "enum_pages_schema_type" DEFAULT 'auto';
  ALTER TABLE "_pages_v" ADD COLUMN "version_focus_keyword" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_focus_keyword_key" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_search_intent" "enum__pages_v_version_search_intent";
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_notes" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_open_graph_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_open_graph_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_open_graph_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_canonical_override" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_robots_index" boolean DEFAULT true;
  ALTER TABLE "_pages_v" ADD COLUMN "version_robots_follow" boolean DEFAULT true;
  ALTER TABLE "_pages_v" ADD COLUMN "version_schema_type" "enum__pages_v_version_schema_type" DEFAULT 'auto';
  ALTER TABLE "media" ADD COLUMN "decorative" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "site_seo_id" integer;
  ALTER TABLE "company_settings" ADD COLUMN "schema_organization_type" "enum_company_settings_schema_organization_type" DEFAULT 'Organization';
  ALTER TABLE "pages_secondary_keywords" ADD CONSTRAINT "pages_secondary_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_related_keywords" ADD CONSTRAINT "pages_related_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_target_regions" ADD CONSTRAINT "pages_target_regions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_secondary_keywords" ADD CONSTRAINT "_pages_v_version_secondary_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_related_keywords" ADD CONSTRAINT "_pages_v_version_related_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_target_regions" ADD CONSTRAINT "_pages_v_version_target_regions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_secondary_keywords" ADD CONSTRAINT "site_seo_secondary_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_related_keywords" ADD CONSTRAINT "site_seo_related_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_target_regions" ADD CONSTRAINT "site_seo_target_regions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo" ADD CONSTRAINT "site_seo_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo" ADD CONSTRAINT "site_seo_open_graph_image_id_media_id_fk" FOREIGN KEY ("open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_secondary_keywords" ADD CONSTRAINT "_site_seo_v_version_secondary_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_related_keywords" ADD CONSTRAINT "_site_seo_v_version_related_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_target_regions" ADD CONSTRAINT "_site_seo_v_version_target_regions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v" ADD CONSTRAINT "_site_seo_v_parent_id_site_seo_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_seo"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v" ADD CONSTRAINT "_site_seo_v_version_og_image_id_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v" ADD CONSTRAINT "_site_seo_v_version_open_graph_image_id_media_id_fk" FOREIGN KEY ("version_open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "company_settings_service_regions" ADD CONSTRAINT "company_settings_service_regions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."company_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_secondary_keywords_order_idx" ON "pages_secondary_keywords" USING btree ("_order");
  CREATE INDEX "pages_secondary_keywords_parent_id_idx" ON "pages_secondary_keywords" USING btree ("_parent_id");
  CREATE INDEX "pages_related_keywords_order_idx" ON "pages_related_keywords" USING btree ("_order");
  CREATE INDEX "pages_related_keywords_parent_id_idx" ON "pages_related_keywords" USING btree ("_parent_id");
  CREATE INDEX "pages_target_regions_order_idx" ON "pages_target_regions" USING btree ("_order");
  CREATE INDEX "pages_target_regions_parent_id_idx" ON "pages_target_regions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_secondary_keywords_order_idx" ON "_pages_v_version_secondary_keywords" USING btree ("_order");
  CREATE INDEX "_pages_v_version_secondary_keywords_parent_id_idx" ON "_pages_v_version_secondary_keywords" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_related_keywords_order_idx" ON "_pages_v_version_related_keywords" USING btree ("_order");
  CREATE INDEX "_pages_v_version_related_keywords_parent_id_idx" ON "_pages_v_version_related_keywords" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_target_regions_order_idx" ON "_pages_v_version_target_regions" USING btree ("_order");
  CREATE INDEX "_pages_v_version_target_regions_parent_id_idx" ON "_pages_v_version_target_regions" USING btree ("_parent_id");
  CREATE INDEX "site_seo_secondary_keywords_order_idx" ON "site_seo_secondary_keywords" USING btree ("_order");
  CREATE INDEX "site_seo_secondary_keywords_parent_id_idx" ON "site_seo_secondary_keywords" USING btree ("_parent_id");
  CREATE INDEX "site_seo_related_keywords_order_idx" ON "site_seo_related_keywords" USING btree ("_order");
  CREATE INDEX "site_seo_related_keywords_parent_id_idx" ON "site_seo_related_keywords" USING btree ("_parent_id");
  CREATE INDEX "site_seo_target_regions_order_idx" ON "site_seo_target_regions" USING btree ("_order");
  CREATE INDEX "site_seo_target_regions_parent_id_idx" ON "site_seo_target_regions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_seo_route_idx" ON "site_seo" USING btree ("route");
  CREATE INDEX "site_seo_og_image_idx" ON "site_seo" USING btree ("og_image_id");
  CREATE INDEX "site_seo_focus_keyword_key_idx" ON "site_seo" USING btree ("focus_keyword_key");
  CREATE INDEX "site_seo_open_graph_open_graph_image_idx" ON "site_seo" USING btree ("open_graph_image_id");
  CREATE INDEX "site_seo_updated_at_idx" ON "site_seo" USING btree ("updated_at");
  CREATE INDEX "site_seo_created_at_idx" ON "site_seo" USING btree ("created_at");
  CREATE INDEX "site_seo__status_idx" ON "site_seo" USING btree ("_status");
  CREATE INDEX "_site_seo_v_version_secondary_keywords_order_idx" ON "_site_seo_v_version_secondary_keywords" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_secondary_keywords_parent_id_idx" ON "_site_seo_v_version_secondary_keywords" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_version_related_keywords_order_idx" ON "_site_seo_v_version_related_keywords" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_related_keywords_parent_id_idx" ON "_site_seo_v_version_related_keywords" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_version_target_regions_order_idx" ON "_site_seo_v_version_target_regions" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_target_regions_parent_id_idx" ON "_site_seo_v_version_target_regions" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_parent_idx" ON "_site_seo_v" USING btree ("parent_id");
  CREATE INDEX "_site_seo_v_version_version_route_idx" ON "_site_seo_v" USING btree ("version_route");
  CREATE INDEX "_site_seo_v_version_version_og_image_idx" ON "_site_seo_v" USING btree ("version_og_image_id");
  CREATE INDEX "_site_seo_v_version_version_focus_keyword_key_idx" ON "_site_seo_v" USING btree ("version_focus_keyword_key");
  CREATE INDEX "_site_seo_v_version_open_graph_version_open_graph_image_idx" ON "_site_seo_v" USING btree ("version_open_graph_image_id");
  CREATE INDEX "_site_seo_v_version_version_updated_at_idx" ON "_site_seo_v" USING btree ("version_updated_at");
  CREATE INDEX "_site_seo_v_version_version_created_at_idx" ON "_site_seo_v" USING btree ("version_created_at");
  CREATE INDEX "_site_seo_v_version_version__status_idx" ON "_site_seo_v" USING btree ("version__status");
  CREATE INDEX "_site_seo_v_created_at_idx" ON "_site_seo_v" USING btree ("created_at");
  CREATE INDEX "_site_seo_v_updated_at_idx" ON "_site_seo_v" USING btree ("updated_at");
  CREATE INDEX "_site_seo_v_latest_idx" ON "_site_seo_v" USING btree ("latest");
  CREATE INDEX "company_settings_service_regions_order_idx" ON "company_settings_service_regions" USING btree ("_order");
  CREATE INDEX "company_settings_service_regions_parent_id_idx" ON "company_settings_service_regions" USING btree ("_parent_id");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_open_graph_image_id_media_id_fk" FOREIGN KEY ("open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_open_graph_image_id_media_id_fk" FOREIGN KEY ("version_open_graph_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_seo_fk" FOREIGN KEY ("site_seo_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  INSERT INTO "pages_target_regions" ("_order", "_parent_id", "id", "region")
    SELECT defaults.position, pages.id, substr(md5('seo-region:' || pages.id || ':' || defaults.position), 1, 24), defaults.name
    FROM "pages" CROSS JOIN (VALUES (1, 'Москва'), (2, 'Московская область')) AS defaults(position, name);
  INSERT INTO "_pages_v_version_target_regions" ("_order", "_parent_id", "region", "_uuid")
    SELECT defaults.position, version.id, defaults.name, substr(md5('seo-region:' || coalesce(version.parent_id, version.id) || ':' || defaults.position), 1, 24)
    FROM "_pages_v" AS version CROSS JOIN (VALUES (1, 'Москва'), (2, 'Московская область')) AS defaults(position, name);
  CREATE INDEX "pages_focus_keyword_key_idx" ON "pages" USING btree ("focus_keyword_key");
  CREATE INDEX "pages_open_graph_open_graph_image_idx" ON "pages" USING btree ("open_graph_image_id");
  CREATE INDEX "_pages_v_version_version_focus_keyword_key_idx" ON "_pages_v" USING btree ("version_focus_keyword_key");
  CREATE INDEX "_pages_v_version_open_graph_version_open_graph_image_idx" ON "_pages_v" USING btree ("version_open_graph_image_id");
  CREATE INDEX "payload_locked_documents_rels_site_seo_id_idx" ON "payload_locked_documents_rels" USING btree ("site_seo_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages" DROP CONSTRAINT "pages_open_graph_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_open_graph_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_site_seo_fk";

  DROP TABLE
    "pages_secondary_keywords", "pages_related_keywords", "pages_target_regions",
    "_pages_v_version_secondary_keywords", "_pages_v_version_related_keywords", "_pages_v_version_target_regions",
    "site_seo_secondary_keywords", "site_seo_related_keywords", "site_seo_target_regions", "site_seo",
    "_site_seo_v_version_secondary_keywords", "_site_seo_v_version_related_keywords", "_site_seo_v_version_target_regions", "_site_seo_v",
    "company_settings_service_regions";
  
  DROP INDEX "pages_focus_keyword_key_idx";
  DROP INDEX "pages_open_graph_open_graph_image_idx";
  DROP INDEX "_pages_v_version_version_focus_keyword_key_idx";
  DROP INDEX "_pages_v_version_open_graph_version_open_graph_image_idx";
  DROP INDEX "payload_locked_documents_rels_site_seo_id_idx";
  UPDATE "media" SET "alt" = '' WHERE "alt" IS NULL;
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "focus_keyword";
  ALTER TABLE "pages" DROP COLUMN "focus_keyword_key";
  ALTER TABLE "pages" DROP COLUMN "search_intent";
  ALTER TABLE "pages" DROP COLUMN "seo_notes";
  ALTER TABLE "pages" DROP COLUMN "open_graph_title";
  ALTER TABLE "pages" DROP COLUMN "open_graph_description";
  ALTER TABLE "pages" DROP COLUMN "open_graph_image_id";
  ALTER TABLE "pages" DROP COLUMN "canonical_override";
  ALTER TABLE "pages" DROP COLUMN "robots_index";
  ALTER TABLE "pages" DROP COLUMN "robots_follow";
  ALTER TABLE "pages" DROP COLUMN "schema_type";
  ALTER TABLE "_pages_v" DROP COLUMN "version_focus_keyword";
  ALTER TABLE "_pages_v" DROP COLUMN "version_focus_keyword_key";
  ALTER TABLE "_pages_v" DROP COLUMN "version_search_intent";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_notes";
  ALTER TABLE "_pages_v" DROP COLUMN "version_open_graph_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_open_graph_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_open_graph_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_canonical_override";
  ALTER TABLE "_pages_v" DROP COLUMN "version_robots_index";
  ALTER TABLE "_pages_v" DROP COLUMN "version_robots_follow";
  ALTER TABLE "_pages_v" DROP COLUMN "version_schema_type";
  ALTER TABLE "media" DROP COLUMN "decorative";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "site_seo_id";
  ALTER TABLE "company_settings" DROP COLUMN "schema_organization_type";
  DROP TYPE "public"."enum_pages_search_intent";
  DROP TYPE "public"."enum_pages_schema_type";
  DROP TYPE "public"."enum__pages_v_version_search_intent";
  DROP TYPE "public"."enum__pages_v_version_schema_type";
  DROP TYPE "public"."enum_site_seo_route";
  DROP TYPE "public"."enum_site_seo_search_intent";
  DROP TYPE "public"."enum_site_seo_schema_type";
  DROP TYPE "public"."enum_site_seo_status";
  DROP TYPE "public"."enum__site_seo_v_version_route";
  DROP TYPE "public"."enum__site_seo_v_version_search_intent";
  DROP TYPE "public"."enum__site_seo_v_version_schema_type";
  DROP TYPE "public"."enum__site_seo_v_version_status";
  DROP TYPE "public"."enum_company_settings_schema_organization_type";`)
}
