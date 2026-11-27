import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_seo_blocks_hero_action" AS ENUM('callback', 'phone', 'section', 'page', 'external');
  CREATE TYPE "public"."enum_site_seo_blocks_hero_section_path" AS ENUM('/chto-delat-esli-umer-chelovek', '/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal');
  CREATE TYPE "public"."enum_site_seo_blocks_intro_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_site_seo_blocks_benefits_items_icon_type" AS ENUM('library', 'image');
  CREATE TYPE "public"."enum_site_seo_blocks_benefits_items_icon" AS ENUM('HeartHandshake', 'ReceiptText', 'Clock', 'ClipboardCheck', 'Wallet', 'MapPin', 'Flower2', 'Flame', 'FileText', 'Package', 'Truck', 'Church', 'Landmark', 'Utensils');
  CREATE TYPE "public"."enum_site_seo_blocks_competencies_items_icon" AS ENUM('HeartHandshake', 'ReceiptText', 'Clock', 'ClipboardCheck', 'Wallet', 'MapPin', 'Flower2', 'Flame', 'FileText', 'Package', 'Truck', 'Church', 'Landmark', 'Utensils');
  CREATE TYPE "public"."enum_site_seo_blocks_steps_items_icon" AS ENUM('HeartHandshake', 'ReceiptText', 'Clock', 'ClipboardCheck', 'Wallet', 'MapPin', 'Flower2', 'Flame', 'FileText', 'Package', 'Truck', 'Church', 'Landmark', 'Utensils');
  CREATE TYPE "public"."enum__site_seo_v_blocks_hero_action" AS ENUM('callback', 'phone', 'section', 'page', 'external');
  CREATE TYPE "public"."enum__site_seo_v_blocks_hero_section_path" AS ENUM('/chto-delat-esli-umer-chelovek', '/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal');
  CREATE TYPE "public"."enum__site_seo_v_blocks_intro_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__site_seo_v_blocks_benefits_items_icon_type" AS ENUM('library', 'image');
  CREATE TYPE "public"."enum__site_seo_v_blocks_benefits_items_icon" AS ENUM('HeartHandshake', 'ReceiptText', 'Clock', 'ClipboardCheck', 'Wallet', 'MapPin', 'Flower2', 'Flame', 'FileText', 'Package', 'Truck', 'Church', 'Landmark', 'Utensils');
  CREATE TYPE "public"."enum__site_seo_v_blocks_competencies_items_icon" AS ENUM('HeartHandshake', 'ReceiptText', 'Clock', 'ClipboardCheck', 'Wallet', 'MapPin', 'Flower2', 'Flame', 'FileText', 'Package', 'Truck', 'Church', 'Landmark', 'Utensils');
  CREATE TYPE "public"."enum__site_seo_v_blocks_steps_items_icon" AS ENUM('HeartHandshake', 'ReceiptText', 'Clock', 'ClipboardCheck', 'Wallet', 'MapPin', 'Flower2', 'Flame', 'FileText', 'Package', 'Truck', 'Church', 'Landmark', 'Utensils');
  CREATE TABLE "site_seo_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"eyebrow" varchar,
  	"subtitle" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"alt" varchar,
  	"button" varchar,
  	"action" "enum_site_seo_blocks_hero_action" DEFAULT 'callback',
  	"section_path" "enum_site_seo_blocks_hero_section_path",
  	"page_id" integer,
  	"url" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"alt" varchar,
  	"side" "enum_site_seo_blocks_intro_side" DEFAULT 'right',
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"icon_type" "enum_site_seo_blocks_benefits_items_icon_type" DEFAULT 'library',
  	"icon" "enum_site_seo_blocks_benefits_items_icon",
  	"image_id" integer
  );
  
  CREATE TABLE "site_seo_blocks_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_competencies_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"service_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"icon" "enum_site_seo_blocks_competencies_items_icon",
  	"image_id" integer,
  	"alt" varchar
  );
  
  CREATE TABLE "site_seo_blocks_competencies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"icon" "enum_site_seo_blocks_steps_items_icon"
  );
  
  CREATE TABLE "site_seo_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_team_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"first_name" varchar,
  	"last_name" varchar,
  	"middle_name" varchar,
  	"role" varchar,
  	"description" varchar,
  	"details" varchar,
  	"image_id" integer,
  	"alt" varchar,
  	"illustrative" boolean DEFAULT false
  );
  
  CREATE TABLE "site_seo_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_legal_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"file_id" integer
  );
  
  CREATE TABLE "site_seo_blocks_legal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_seo_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"call" varchar,
  	"callback" varchar,
  	"note" varchar,
  	"show_hours" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"eyebrow" varchar,
  	"subtitle" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"alt" varchar,
  	"button" varchar,
  	"action" "enum__site_seo_v_blocks_hero_action" DEFAULT 'callback',
  	"section_path" "enum__site_seo_v_blocks_hero_section_path",
  	"page_id" integer,
  	"url" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"body" jsonb,
  	"image_id" integer,
  	"alt" varchar,
  	"side" "enum__site_seo_v_blocks_intro_side" DEFAULT 'right',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"icon_type" "enum__site_seo_v_blocks_benefits_items_icon_type" DEFAULT 'library',
  	"icon" "enum__site_seo_v_blocks_benefits_items_icon",
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_competencies_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"service_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"icon" "enum__site_seo_v_blocks_competencies_items_icon",
  	"image_id" integer,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_competencies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"icon" "enum__site_seo_v_blocks_steps_items_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_team_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"first_name" varchar,
  	"last_name" varchar,
  	"middle_name" varchar,
  	"role" varchar,
  	"description" varchar,
  	"details" varchar,
  	"image_id" integer,
  	"alt" varchar,
  	"illustrative" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_legal_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_legal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_site_seo_v_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"visible" boolean DEFAULT true,
  	"title" varchar,
  	"description" varchar,
  	"call" varchar,
  	"callback" varchar,
  	"note" varchar,
  	"show_hours" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "public_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"date" timestamp(3) with time zone,
  	"approved" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "site_seo" ADD COLUMN "about_initialized" boolean;
  ALTER TABLE "_site_seo_v" ADD COLUMN "version_about_initialized" boolean;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "public_documents_id" integer;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_confirmed" boolean DEFAULT false;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_legal_name" varchar;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_trade_name" varchar;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_inn" varchar;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_ogrnip" varchar;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_registered" timestamp(3) with time zone;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_address" varchar;
  ALTER TABLE "company_settings" ADD COLUMN "legal_details_details" varchar;
  ALTER TABLE "site_seo_blocks_hero" ADD CONSTRAINT "site_seo_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_hero" ADD CONSTRAINT "site_seo_blocks_hero_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_hero" ADD CONSTRAINT "site_seo_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_intro" ADD CONSTRAINT "site_seo_blocks_intro_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_intro" ADD CONSTRAINT "site_seo_blocks_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_benefits_items" ADD CONSTRAINT "site_seo_blocks_benefits_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_benefits_items" ADD CONSTRAINT "site_seo_blocks_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo_blocks_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_benefits" ADD CONSTRAINT "site_seo_blocks_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_competencies_items" ADD CONSTRAINT "site_seo_blocks_competencies_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_competencies_items" ADD CONSTRAINT "site_seo_blocks_competencies_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_competencies_items" ADD CONSTRAINT "site_seo_blocks_competencies_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo_blocks_competencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_competencies" ADD CONSTRAINT "site_seo_blocks_competencies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_steps_items" ADD CONSTRAINT "site_seo_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_steps" ADD CONSTRAINT "site_seo_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_team_items" ADD CONSTRAINT "site_seo_blocks_team_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_team_items" ADD CONSTRAINT "site_seo_blocks_team_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_team" ADD CONSTRAINT "site_seo_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_legal_items" ADD CONSTRAINT "site_seo_blocks_legal_items_file_id_public_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."public_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_legal_items" ADD CONSTRAINT "site_seo_blocks_legal_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo_blocks_legal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_legal" ADD CONSTRAINT "site_seo_blocks_legal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_blocks_contact" ADD CONSTRAINT "site_seo_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_hero" ADD CONSTRAINT "_site_seo_v_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_hero" ADD CONSTRAINT "_site_seo_v_blocks_hero_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_hero" ADD CONSTRAINT "_site_seo_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_intro" ADD CONSTRAINT "_site_seo_v_blocks_intro_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_intro" ADD CONSTRAINT "_site_seo_v_blocks_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_benefits_items" ADD CONSTRAINT "_site_seo_v_blocks_benefits_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_benefits_items" ADD CONSTRAINT "_site_seo_v_blocks_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v_blocks_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_benefits" ADD CONSTRAINT "_site_seo_v_blocks_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_competencies_items" ADD CONSTRAINT "_site_seo_v_blocks_competencies_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_competencies_items" ADD CONSTRAINT "_site_seo_v_blocks_competencies_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_competencies_items" ADD CONSTRAINT "_site_seo_v_blocks_competencies_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v_blocks_competencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_competencies" ADD CONSTRAINT "_site_seo_v_blocks_competencies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_steps_items" ADD CONSTRAINT "_site_seo_v_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_steps" ADD CONSTRAINT "_site_seo_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_team_items" ADD CONSTRAINT "_site_seo_v_blocks_team_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_team_items" ADD CONSTRAINT "_site_seo_v_blocks_team_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_team" ADD CONSTRAINT "_site_seo_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_legal_items" ADD CONSTRAINT "_site_seo_v_blocks_legal_items_file_id_public_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."public_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_legal_items" ADD CONSTRAINT "_site_seo_v_blocks_legal_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v_blocks_legal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_legal" ADD CONSTRAINT "_site_seo_v_blocks_legal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_blocks_contact" ADD CONSTRAINT "_site_seo_v_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_seo_blocks_hero_order_idx" ON "site_seo_blocks_hero" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_hero_parent_id_idx" ON "site_seo_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_hero_path_idx" ON "site_seo_blocks_hero" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_hero_image_idx" ON "site_seo_blocks_hero" USING btree ("image_id");
  CREATE INDEX "site_seo_blocks_hero_page_idx" ON "site_seo_blocks_hero" USING btree ("page_id");
  CREATE INDEX "site_seo_blocks_intro_order_idx" ON "site_seo_blocks_intro" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_intro_parent_id_idx" ON "site_seo_blocks_intro" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_intro_path_idx" ON "site_seo_blocks_intro" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_intro_image_idx" ON "site_seo_blocks_intro" USING btree ("image_id");
  CREATE INDEX "site_seo_blocks_benefits_items_order_idx" ON "site_seo_blocks_benefits_items" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_benefits_items_parent_id_idx" ON "site_seo_blocks_benefits_items" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_benefits_items_image_idx" ON "site_seo_blocks_benefits_items" USING btree ("image_id");
  CREATE INDEX "site_seo_blocks_benefits_order_idx" ON "site_seo_blocks_benefits" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_benefits_parent_id_idx" ON "site_seo_blocks_benefits" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_benefits_path_idx" ON "site_seo_blocks_benefits" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_competencies_items_order_idx" ON "site_seo_blocks_competencies_items" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_competencies_items_parent_id_idx" ON "site_seo_blocks_competencies_items" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_competencies_items_service_idx" ON "site_seo_blocks_competencies_items" USING btree ("service_id");
  CREATE INDEX "site_seo_blocks_competencies_items_image_idx" ON "site_seo_blocks_competencies_items" USING btree ("image_id");
  CREATE INDEX "site_seo_blocks_competencies_order_idx" ON "site_seo_blocks_competencies" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_competencies_parent_id_idx" ON "site_seo_blocks_competencies" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_competencies_path_idx" ON "site_seo_blocks_competencies" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_steps_items_order_idx" ON "site_seo_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_steps_items_parent_id_idx" ON "site_seo_blocks_steps_items" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_steps_order_idx" ON "site_seo_blocks_steps" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_steps_parent_id_idx" ON "site_seo_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_steps_path_idx" ON "site_seo_blocks_steps" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_team_items_order_idx" ON "site_seo_blocks_team_items" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_team_items_parent_id_idx" ON "site_seo_blocks_team_items" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_team_items_image_idx" ON "site_seo_blocks_team_items" USING btree ("image_id");
  CREATE INDEX "site_seo_blocks_team_order_idx" ON "site_seo_blocks_team" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_team_parent_id_idx" ON "site_seo_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_team_path_idx" ON "site_seo_blocks_team" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_legal_items_order_idx" ON "site_seo_blocks_legal_items" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_legal_items_parent_id_idx" ON "site_seo_blocks_legal_items" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_legal_items_file_idx" ON "site_seo_blocks_legal_items" USING btree ("file_id");
  CREATE INDEX "site_seo_blocks_legal_order_idx" ON "site_seo_blocks_legal" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_legal_parent_id_idx" ON "site_seo_blocks_legal" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_legal_path_idx" ON "site_seo_blocks_legal" USING btree ("_path");
  CREATE INDEX "site_seo_blocks_contact_order_idx" ON "site_seo_blocks_contact" USING btree ("_order");
  CREATE INDEX "site_seo_blocks_contact_parent_id_idx" ON "site_seo_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "site_seo_blocks_contact_path_idx" ON "site_seo_blocks_contact" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_hero_order_idx" ON "_site_seo_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_hero_parent_id_idx" ON "_site_seo_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_hero_path_idx" ON "_site_seo_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_hero_image_idx" ON "_site_seo_v_blocks_hero" USING btree ("image_id");
  CREATE INDEX "_site_seo_v_blocks_hero_page_idx" ON "_site_seo_v_blocks_hero" USING btree ("page_id");
  CREATE INDEX "_site_seo_v_blocks_intro_order_idx" ON "_site_seo_v_blocks_intro" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_intro_parent_id_idx" ON "_site_seo_v_blocks_intro" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_intro_path_idx" ON "_site_seo_v_blocks_intro" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_intro_image_idx" ON "_site_seo_v_blocks_intro" USING btree ("image_id");
  CREATE INDEX "_site_seo_v_blocks_benefits_items_order_idx" ON "_site_seo_v_blocks_benefits_items" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_benefits_items_parent_id_idx" ON "_site_seo_v_blocks_benefits_items" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_benefits_items_image_idx" ON "_site_seo_v_blocks_benefits_items" USING btree ("image_id");
  CREATE INDEX "_site_seo_v_blocks_benefits_order_idx" ON "_site_seo_v_blocks_benefits" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_benefits_parent_id_idx" ON "_site_seo_v_blocks_benefits" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_benefits_path_idx" ON "_site_seo_v_blocks_benefits" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_competencies_items_order_idx" ON "_site_seo_v_blocks_competencies_items" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_competencies_items_parent_id_idx" ON "_site_seo_v_blocks_competencies_items" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_competencies_items_service_idx" ON "_site_seo_v_blocks_competencies_items" USING btree ("service_id");
  CREATE INDEX "_site_seo_v_blocks_competencies_items_image_idx" ON "_site_seo_v_blocks_competencies_items" USING btree ("image_id");
  CREATE INDEX "_site_seo_v_blocks_competencies_order_idx" ON "_site_seo_v_blocks_competencies" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_competencies_parent_id_idx" ON "_site_seo_v_blocks_competencies" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_competencies_path_idx" ON "_site_seo_v_blocks_competencies" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_steps_items_order_idx" ON "_site_seo_v_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_steps_items_parent_id_idx" ON "_site_seo_v_blocks_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_steps_order_idx" ON "_site_seo_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_steps_parent_id_idx" ON "_site_seo_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_steps_path_idx" ON "_site_seo_v_blocks_steps" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_team_items_order_idx" ON "_site_seo_v_blocks_team_items" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_team_items_parent_id_idx" ON "_site_seo_v_blocks_team_items" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_team_items_image_idx" ON "_site_seo_v_blocks_team_items" USING btree ("image_id");
  CREATE INDEX "_site_seo_v_blocks_team_order_idx" ON "_site_seo_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_team_parent_id_idx" ON "_site_seo_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_team_path_idx" ON "_site_seo_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_legal_items_order_idx" ON "_site_seo_v_blocks_legal_items" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_legal_items_parent_id_idx" ON "_site_seo_v_blocks_legal_items" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_legal_items_file_idx" ON "_site_seo_v_blocks_legal_items" USING btree ("file_id");
  CREATE INDEX "_site_seo_v_blocks_legal_order_idx" ON "_site_seo_v_blocks_legal" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_legal_parent_id_idx" ON "_site_seo_v_blocks_legal" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_legal_path_idx" ON "_site_seo_v_blocks_legal" USING btree ("_path");
  CREATE INDEX "_site_seo_v_blocks_contact_order_idx" ON "_site_seo_v_blocks_contact" USING btree ("_order");
  CREATE INDEX "_site_seo_v_blocks_contact_parent_id_idx" ON "_site_seo_v_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_blocks_contact_path_idx" ON "_site_seo_v_blocks_contact" USING btree ("_path");
  CREATE INDEX "public_documents_updated_at_idx" ON "public_documents" USING btree ("updated_at");
  CREATE INDEX "public_documents_created_at_idx" ON "public_documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "public_documents_filename_idx" ON "public_documents" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_public_documents_fk" FOREIGN KEY ("public_documents_id") REFERENCES "public"."public_documents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_public_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("public_documents_id");
  UPDATE "company_settings" SET
    "legal_details_legal_name" = 'Индивидуальный предприниматель Макаров Роман Васильевич',
    "legal_details_trade_name" = 'Ритуал Групп 24';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_seo_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_benefits_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_competencies_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_competencies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_team_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_legal_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_legal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_seo_blocks_contact" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_benefits_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_competencies_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_competencies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_team_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_legal_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_legal" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_site_seo_v_blocks_contact" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "public_documents" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "site_seo_blocks_hero" CASCADE;
  DROP TABLE "site_seo_blocks_intro" CASCADE;
  DROP TABLE "site_seo_blocks_benefits_items" CASCADE;
  DROP TABLE "site_seo_blocks_benefits" CASCADE;
  DROP TABLE "site_seo_blocks_competencies_items" CASCADE;
  DROP TABLE "site_seo_blocks_competencies" CASCADE;
  DROP TABLE "site_seo_blocks_steps_items" CASCADE;
  DROP TABLE "site_seo_blocks_steps" CASCADE;
  DROP TABLE "site_seo_blocks_team_items" CASCADE;
  DROP TABLE "site_seo_blocks_team" CASCADE;
  DROP TABLE "site_seo_blocks_legal_items" CASCADE;
  DROP TABLE "site_seo_blocks_legal" CASCADE;
  DROP TABLE "site_seo_blocks_contact" CASCADE;
  DROP TABLE "_site_seo_v_blocks_hero" CASCADE;
  DROP TABLE "_site_seo_v_blocks_intro" CASCADE;
  DROP TABLE "_site_seo_v_blocks_benefits_items" CASCADE;
  DROP TABLE "_site_seo_v_blocks_benefits" CASCADE;
  DROP TABLE "_site_seo_v_blocks_competencies_items" CASCADE;
  DROP TABLE "_site_seo_v_blocks_competencies" CASCADE;
  DROP TABLE "_site_seo_v_blocks_steps_items" CASCADE;
  DROP TABLE "_site_seo_v_blocks_steps" CASCADE;
  DROP TABLE "_site_seo_v_blocks_team_items" CASCADE;
  DROP TABLE "_site_seo_v_blocks_team" CASCADE;
  DROP TABLE "_site_seo_v_blocks_legal_items" CASCADE;
  DROP TABLE "_site_seo_v_blocks_legal" CASCADE;
  DROP TABLE "_site_seo_v_blocks_contact" CASCADE;
  DROP TABLE "public_documents" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_public_documents_fk";
  
  DROP INDEX "payload_locked_documents_rels_public_documents_id_idx";
  ALTER TABLE "site_seo" DROP COLUMN "about_initialized";
  ALTER TABLE "_site_seo_v" DROP COLUMN "version_about_initialized";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "public_documents_id";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_confirmed";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_legal_name";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_trade_name";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_inn";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_ogrnip";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_registered";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_address";
  ALTER TABLE "company_settings" DROP COLUMN "legal_details_details";
  DROP TYPE "public"."enum_site_seo_blocks_hero_action";
  DROP TYPE "public"."enum_site_seo_blocks_hero_section_path";
  DROP TYPE "public"."enum_site_seo_blocks_intro_side";
  DROP TYPE "public"."enum_site_seo_blocks_benefits_items_icon_type";
  DROP TYPE "public"."enum_site_seo_blocks_benefits_items_icon";
  DROP TYPE "public"."enum_site_seo_blocks_competencies_items_icon";
  DROP TYPE "public"."enum_site_seo_blocks_steps_items_icon";
  DROP TYPE "public"."enum__site_seo_v_blocks_hero_action";
  DROP TYPE "public"."enum__site_seo_v_blocks_hero_section_path";
  DROP TYPE "public"."enum__site_seo_v_blocks_intro_side";
  DROP TYPE "public"."enum__site_seo_v_blocks_benefits_items_icon_type";
  DROP TYPE "public"."enum__site_seo_v_blocks_benefits_items_icon";
  DROP TYPE "public"."enum__site_seo_v_blocks_competencies_items_icon";
  DROP TYPE "public"."enum__site_seo_v_blocks_steps_items_icon";`)
}
