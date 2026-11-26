import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_funeral_offers_items_group" AS ENUM('coffin', 'lining', 'accessories', 'flowers', 'cross', 'urn', 'agent', 'papers', 'transport', 'team', 'ceremony', 'extra');
  CREATE TYPE "public"."enum_funeral_offers_items_state" AS ENUM('included', 'optional', 'separate', 'absent', 'negotiated');
  CREATE TYPE "public"."enum_funeral_offers_format" AS ENUM('burial', 'cremation');
  CREATE TYPE "public"."enum_funeral_offers_price_type" AS ENUM('fixed', 'from', 'individual', 'request');
  CREATE TYPE "public"."enum_funeral_offers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__funeral_offers_v_version_items_group" AS ENUM('coffin', 'lining', 'accessories', 'flowers', 'cross', 'urn', 'agent', 'papers', 'transport', 'team', 'ceremony', 'extra');
  CREATE TYPE "public"."enum__funeral_offers_v_version_items_state" AS ENUM('included', 'optional', 'separate', 'absent', 'negotiated');
  CREATE TYPE "public"."enum__funeral_offers_v_version_format" AS ENUM('burial', 'cremation');
  CREATE TYPE "public"."enum__funeral_offers_v_version_price_type" AS ENUM('fixed', 'from', 'individual', 'request');
  CREATE TYPE "public"."enum__funeral_offers_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "funeral_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "funeral_offers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" "enum_funeral_offers_items_group",
  	"state" "enum_funeral_offers_items_state" DEFAULT 'included',
  	"label" varchar,
  	"quantity" numeric DEFAULT 1,
  	"unit" varchar,
  	"comment" varchar,
  	"limits" varchar,
  	"alternative_id" integer,
  	"short" boolean,
  	"show_price" boolean
  );
  
  CREATE TABLE "funeral_offers_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "funeral_offers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"category_id" integer,
  	"format" "enum_funeral_offers_format",
  	"summary" varchar,
  	"description" varchar,
  	"benefits" varchar,
  	"accent" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"price_type" "enum_funeral_offers_price_type" DEFAULT 'request',
  	"amount" numeric,
  	"price_date" timestamp(3) with time zone,
  	"included" varchar,
  	"excluded" varchar,
  	"expenses" varchar,
  	"terms" varchar,
  	"region" varchar,
  	"cover_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"og_title" varchar,
  	"og_description" varchar,
  	"og_image_id" integer,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_funeral_offers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "funeral_offers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"products_id" integer,
  	"services_id" integer
  );
  
  CREATE TABLE "_funeral_offers_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" "enum__funeral_offers_v_version_items_group",
  	"state" "enum__funeral_offers_v_version_items_state" DEFAULT 'included',
  	"label" varchar,
  	"quantity" numeric DEFAULT 1,
  	"unit" varchar,
  	"comment" varchar,
  	"limits" varchar,
  	"alternative_id" integer,
  	"short" boolean,
  	"show_price" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_funeral_offers_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_funeral_offers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_category_id" integer,
  	"version_format" "enum__funeral_offers_v_version_format",
  	"version_summary" varchar,
  	"version_description" varchar,
  	"version_benefits" varchar,
  	"version_accent" varchar,
  	"version_sort_order" numeric DEFAULT 0,
  	"version_price_type" "enum__funeral_offers_v_version_price_type" DEFAULT 'request',
  	"version_amount" numeric,
  	"version_price_date" timestamp(3) with time zone,
  	"version_included" varchar,
  	"version_excluded" varchar,
  	"version_expenses" varchar,
  	"version_terms" varchar,
  	"version_region" varchar,
  	"version_cover_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_og_title" varchar,
  	"version_og_description" varchar,
  	"version_og_image_id" integer,
  	"version_archived" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__funeral_offers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_funeral_offers_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"products_id" integer,
  	"services_id" integer
  );
  
  CREATE TABLE "funeral_settings_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "funeral_settings_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar
  );
  
  CREATE TABLE "funeral_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Организация похорон в Москве и Московской области',
  	"intro" varchar DEFAULT 'Комплексная организация похорон с учётом ваших пожеланий, традиций и финансовых возможностей.',
  	"hero_id" integer,
  	"benefits" varchar,
  	"choose_label" varchar,
  	"consult_label" varchar,
  	"documents" varchar,
  	"geography" varchar,
  	"advantages" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "funeral_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer
  );
  
  ALTER TABLE "leads" ADD COLUMN "offer_snapshot" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "funeral_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "funeral_offers_id" integer;
  ALTER TABLE "funeral_offers_items" ADD CONSTRAINT "funeral_offers_items_alternative_id_products_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "funeral_offers_items" ADD CONSTRAINT "funeral_offers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."funeral_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_offers_faq" ADD CONSTRAINT "funeral_offers_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."funeral_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_offers" ADD CONSTRAINT "funeral_offers_category_id_funeral_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."funeral_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "funeral_offers" ADD CONSTRAINT "funeral_offers_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "funeral_offers" ADD CONSTRAINT "funeral_offers_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "funeral_offers_rels" ADD CONSTRAINT "funeral_offers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."funeral_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_offers_rels" ADD CONSTRAINT "funeral_offers_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_offers_rels" ADD CONSTRAINT "funeral_offers_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_offers_rels" ADD CONSTRAINT "funeral_offers_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_version_items" ADD CONSTRAINT "_funeral_offers_v_version_items_alternative_id_products_id_fk" FOREIGN KEY ("alternative_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_version_items" ADD CONSTRAINT "_funeral_offers_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_funeral_offers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_version_faq" ADD CONSTRAINT "_funeral_offers_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_funeral_offers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v" ADD CONSTRAINT "_funeral_offers_v_parent_id_funeral_offers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."funeral_offers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v" ADD CONSTRAINT "_funeral_offers_v_version_category_id_funeral_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."funeral_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v" ADD CONSTRAINT "_funeral_offers_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v" ADD CONSTRAINT "_funeral_offers_v_version_og_image_id_media_id_fk" FOREIGN KEY ("version_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_rels" ADD CONSTRAINT "_funeral_offers_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_funeral_offers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_rels" ADD CONSTRAINT "_funeral_offers_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_rels" ADD CONSTRAINT "_funeral_offers_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_funeral_offers_v_rels" ADD CONSTRAINT "_funeral_offers_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_settings_steps" ADD CONSTRAINT "funeral_settings_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."funeral_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_settings_faq" ADD CONSTRAINT "funeral_settings_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."funeral_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_settings" ADD CONSTRAINT "funeral_settings_hero_id_media_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "funeral_settings_rels" ADD CONSTRAINT "funeral_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."funeral_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "funeral_settings_rels" ADD CONSTRAINT "funeral_settings_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "funeral_categories_title_idx" ON "funeral_categories" USING btree ("title");
  CREATE INDEX "funeral_categories_updated_at_idx" ON "funeral_categories" USING btree ("updated_at");
  CREATE INDEX "funeral_categories_created_at_idx" ON "funeral_categories" USING btree ("created_at");
  CREATE INDEX "funeral_offers_items_order_idx" ON "funeral_offers_items" USING btree ("_order");
  CREATE INDEX "funeral_offers_items_parent_id_idx" ON "funeral_offers_items" USING btree ("_parent_id");
  CREATE INDEX "funeral_offers_items_alternative_idx" ON "funeral_offers_items" USING btree ("alternative_id");
  CREATE INDEX "funeral_offers_faq_order_idx" ON "funeral_offers_faq" USING btree ("_order");
  CREATE INDEX "funeral_offers_faq_parent_id_idx" ON "funeral_offers_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "funeral_offers_slug_idx" ON "funeral_offers" USING btree ("slug");
  CREATE INDEX "funeral_offers_category_idx" ON "funeral_offers" USING btree ("category_id");
  CREATE INDEX "funeral_offers_cover_idx" ON "funeral_offers" USING btree ("cover_id");
  CREATE INDEX "funeral_offers_og_image_idx" ON "funeral_offers" USING btree ("og_image_id");
  CREATE INDEX "funeral_offers_updated_at_idx" ON "funeral_offers" USING btree ("updated_at");
  CREATE INDEX "funeral_offers_created_at_idx" ON "funeral_offers" USING btree ("created_at");
  CREATE INDEX "funeral_offers__status_idx" ON "funeral_offers" USING btree ("_status");
  CREATE INDEX "funeral_offers_rels_order_idx" ON "funeral_offers_rels" USING btree ("order");
  CREATE INDEX "funeral_offers_rels_parent_idx" ON "funeral_offers_rels" USING btree ("parent_id");
  CREATE INDEX "funeral_offers_rels_path_idx" ON "funeral_offers_rels" USING btree ("path");
  CREATE INDEX "funeral_offers_rels_media_id_idx" ON "funeral_offers_rels" USING btree ("media_id");
  CREATE INDEX "funeral_offers_rels_products_id_idx" ON "funeral_offers_rels" USING btree ("products_id");
  CREATE INDEX "funeral_offers_rels_services_id_idx" ON "funeral_offers_rels" USING btree ("services_id");
  CREATE INDEX "_funeral_offers_v_version_items_order_idx" ON "_funeral_offers_v_version_items" USING btree ("_order");
  CREATE INDEX "_funeral_offers_v_version_items_parent_id_idx" ON "_funeral_offers_v_version_items" USING btree ("_parent_id");
  CREATE INDEX "_funeral_offers_v_version_items_alternative_idx" ON "_funeral_offers_v_version_items" USING btree ("alternative_id");
  CREATE INDEX "_funeral_offers_v_version_faq_order_idx" ON "_funeral_offers_v_version_faq" USING btree ("_order");
  CREATE INDEX "_funeral_offers_v_version_faq_parent_id_idx" ON "_funeral_offers_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_funeral_offers_v_parent_idx" ON "_funeral_offers_v" USING btree ("parent_id");
  CREATE INDEX "_funeral_offers_v_version_version_slug_idx" ON "_funeral_offers_v" USING btree ("version_slug");
  CREATE INDEX "_funeral_offers_v_version_version_category_idx" ON "_funeral_offers_v" USING btree ("version_category_id");
  CREATE INDEX "_funeral_offers_v_version_version_cover_idx" ON "_funeral_offers_v" USING btree ("version_cover_id");
  CREATE INDEX "_funeral_offers_v_version_version_og_image_idx" ON "_funeral_offers_v" USING btree ("version_og_image_id");
  CREATE INDEX "_funeral_offers_v_version_version_updated_at_idx" ON "_funeral_offers_v" USING btree ("version_updated_at");
  CREATE INDEX "_funeral_offers_v_version_version_created_at_idx" ON "_funeral_offers_v" USING btree ("version_created_at");
  CREATE INDEX "_funeral_offers_v_version_version__status_idx" ON "_funeral_offers_v" USING btree ("version__status");
  CREATE INDEX "_funeral_offers_v_created_at_idx" ON "_funeral_offers_v" USING btree ("created_at");
  CREATE INDEX "_funeral_offers_v_updated_at_idx" ON "_funeral_offers_v" USING btree ("updated_at");
  CREATE INDEX "_funeral_offers_v_latest_idx" ON "_funeral_offers_v" USING btree ("latest");
  CREATE INDEX "_funeral_offers_v_rels_order_idx" ON "_funeral_offers_v_rels" USING btree ("order");
  CREATE INDEX "_funeral_offers_v_rels_parent_idx" ON "_funeral_offers_v_rels" USING btree ("parent_id");
  CREATE INDEX "_funeral_offers_v_rels_path_idx" ON "_funeral_offers_v_rels" USING btree ("path");
  CREATE INDEX "_funeral_offers_v_rels_media_id_idx" ON "_funeral_offers_v_rels" USING btree ("media_id");
  CREATE INDEX "_funeral_offers_v_rels_products_id_idx" ON "_funeral_offers_v_rels" USING btree ("products_id");
  CREATE INDEX "_funeral_offers_v_rels_services_id_idx" ON "_funeral_offers_v_rels" USING btree ("services_id");
  CREATE INDEX "funeral_settings_steps_order_idx" ON "funeral_settings_steps" USING btree ("_order");
  CREATE INDEX "funeral_settings_steps_parent_id_idx" ON "funeral_settings_steps" USING btree ("_parent_id");
  CREATE INDEX "funeral_settings_faq_order_idx" ON "funeral_settings_faq" USING btree ("_order");
  CREATE INDEX "funeral_settings_faq_parent_id_idx" ON "funeral_settings_faq" USING btree ("_parent_id");
  CREATE INDEX "funeral_settings_hero_idx" ON "funeral_settings" USING btree ("hero_id");
  CREATE INDEX "funeral_settings_rels_order_idx" ON "funeral_settings_rels" USING btree ("order");
  CREATE INDEX "funeral_settings_rels_parent_idx" ON "funeral_settings_rels" USING btree ("parent_id");
  CREATE INDEX "funeral_settings_rels_path_idx" ON "funeral_settings_rels" USING btree ("path");
  CREATE INDEX "funeral_settings_rels_pages_id_idx" ON "funeral_settings_rels" USING btree ("pages_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_funeral_categories_fk" FOREIGN KEY ("funeral_categories_id") REFERENCES "public"."funeral_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_funeral_offers_fk" FOREIGN KEY ("funeral_offers_id") REFERENCES "public"."funeral_offers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_funeral_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("funeral_categories_id");
  CREATE INDEX "payload_locked_documents_rels_funeral_offers_id_idx" ON "payload_locked_documents_rels" USING btree ("funeral_offers_id");`)
  for (const [order, [title, slug]] of [['Эконом','ekonom'],['Стандарт','standart'],['VIP','vip']].entries()) {
    const category = await payload.create({collection:'funeral-categories', data:{title,sortOrder:order},req})
    for (const format of ['burial','cremation'] as const) {
      const name = format === 'burial' ? 'захоронение' : 'кремация'
      await payload.create({collection:'funeral-offers', draft:true,req,data:{
        title:title+' — '+name,slug:(format === 'cremation' ? 'kremaciya-' : '')+slug,
        category:category.id,format,sortOrder:order,priceType:'request',summary:'',_status:'draft',
      }})
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "funeral_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_offers_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_offers_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_offers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_offers_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_funeral_offers_v_version_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_funeral_offers_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_funeral_offers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_funeral_offers_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_settings_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_settings_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funeral_settings_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "funeral_categories" CASCADE;
  DROP TABLE "funeral_offers_items" CASCADE;
  DROP TABLE "funeral_offers_faq" CASCADE;
  DROP TABLE "funeral_offers" CASCADE;
  DROP TABLE "funeral_offers_rels" CASCADE;
  DROP TABLE "_funeral_offers_v_version_items" CASCADE;
  DROP TABLE "_funeral_offers_v_version_faq" CASCADE;
  DROP TABLE "_funeral_offers_v" CASCADE;
  DROP TABLE "_funeral_offers_v_rels" CASCADE;
  DROP TABLE "funeral_settings_steps" CASCADE;
  DROP TABLE "funeral_settings_faq" CASCADE;
  DROP TABLE "funeral_settings" CASCADE;
  DROP TABLE "funeral_settings_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_funeral_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_funeral_offers_fk";
  
  DROP INDEX "payload_locked_documents_rels_funeral_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_funeral_offers_id_idx";
  ALTER TABLE "leads" DROP COLUMN "offer_snapshot";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "funeral_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "funeral_offers_id";
  DROP TYPE "public"."enum_funeral_offers_items_group";
  DROP TYPE "public"."enum_funeral_offers_items_state";
  DROP TYPE "public"."enum_funeral_offers_format";
  DROP TYPE "public"."enum_funeral_offers_price_type";
  DROP TYPE "public"."enum_funeral_offers_status";
  DROP TYPE "public"."enum__funeral_offers_v_version_items_group";
  DROP TYPE "public"."enum__funeral_offers_v_version_items_state";
  DROP TYPE "public"."enum__funeral_offers_v_version_format";
  DROP TYPE "public"."enum__funeral_offers_v_version_price_type";
  DROP TYPE "public"."enum__funeral_offers_v_version_status";`)
}
