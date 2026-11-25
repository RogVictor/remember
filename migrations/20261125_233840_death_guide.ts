import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_site_seo_route" ADD VALUE '/chto-delat-esli-umer-chelovek' BEFORE '/';
  ALTER TYPE "public"."enum__site_seo_v_version_route" ADD VALUE '/chto-delat-esli-umer-chelovek' BEFORE '/';
  CREATE TABLE "site_seo_home" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "site_seo_hospital" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "site_seo_outside" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "site_seo_away" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "_site_seo_v_version_home" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_version_hospital" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_version_outside" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_seo_v_version_away" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "site_seo_home" ADD CONSTRAINT "site_seo_home_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_hospital" ADD CONSTRAINT "site_seo_hospital_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_outside" ADD CONSTRAINT "site_seo_outside_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_seo_away" ADD CONSTRAINT "site_seo_away_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_seo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_home" ADD CONSTRAINT "_site_seo_v_version_home_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_hospital" ADD CONSTRAINT "_site_seo_v_version_hospital_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_outside" ADD CONSTRAINT "_site_seo_v_version_outside_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_seo_v_version_away" ADD CONSTRAINT "_site_seo_v_version_away_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_seo_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_seo_home_order_idx" ON "site_seo_home" USING btree ("_order");
  CREATE INDEX "site_seo_home_parent_id_idx" ON "site_seo_home" USING btree ("_parent_id");
  CREATE INDEX "site_seo_hospital_order_idx" ON "site_seo_hospital" USING btree ("_order");
  CREATE INDEX "site_seo_hospital_parent_id_idx" ON "site_seo_hospital" USING btree ("_parent_id");
  CREATE INDEX "site_seo_outside_order_idx" ON "site_seo_outside" USING btree ("_order");
  CREATE INDEX "site_seo_outside_parent_id_idx" ON "site_seo_outside" USING btree ("_parent_id");
  CREATE INDEX "site_seo_away_order_idx" ON "site_seo_away" USING btree ("_order");
  CREATE INDEX "site_seo_away_parent_id_idx" ON "site_seo_away" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_version_home_order_idx" ON "_site_seo_v_version_home" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_home_parent_id_idx" ON "_site_seo_v_version_home" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_version_hospital_order_idx" ON "_site_seo_v_version_hospital" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_hospital_parent_id_idx" ON "_site_seo_v_version_hospital" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_version_outside_order_idx" ON "_site_seo_v_version_outside" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_outside_parent_id_idx" ON "_site_seo_v_version_outside" USING btree ("_parent_id");
  CREATE INDEX "_site_seo_v_version_away_order_idx" ON "_site_seo_v_version_away" USING btree ("_order");
  CREATE INDEX "_site_seo_v_version_away_parent_id_idx" ON "_site_seo_v_version_away" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_seo_home" CASCADE;
  DROP TABLE "site_seo_hospital" CASCADE;
  DROP TABLE "site_seo_outside" CASCADE;
  DROP TABLE "site_seo_away" CASCADE;
  DROP TABLE "_site_seo_v_version_home" CASCADE;
  DROP TABLE "_site_seo_v_version_hospital" CASCADE;
  DROP TABLE "_site_seo_v_version_outside" CASCADE;
  DROP TABLE "_site_seo_v_version_away" CASCADE;
  ALTER TABLE "site_seo" ALTER COLUMN "route" SET DATA TYPE text;
  DROP TYPE "public"."enum_site_seo_route";
  CREATE TYPE "public"."enum_site_seo_route" AS ENUM('/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal');
  ALTER TABLE "site_seo" ALTER COLUMN "route" SET DATA TYPE "public"."enum_site_seo_route" USING "route"::"public"."enum_site_seo_route";
  ALTER TABLE "_site_seo_v" ALTER COLUMN "version_route" SET DATA TYPE text;
  DROP TYPE "public"."enum__site_seo_v_version_route";
  CREATE TYPE "public"."enum__site_seo_v_version_route" AS ENUM('/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal');
  ALTER TABLE "_site_seo_v" ALTER COLUMN "version_route" SET DATA TYPE "public"."enum__site_seo_v_version_route" USING "version_route"::"public"."enum__site_seo_v_version_route";`)
}
