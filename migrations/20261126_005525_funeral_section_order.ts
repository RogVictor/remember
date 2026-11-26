import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_funeral_settings_sections_key" AS ENUM('offers', 'comparison', 'directions', 'extras', 'programs', 'steps', 'documents', 'advantages', 'geography', 'articles', 'faq', 'callback');
  CREATE TABLE "funeral_settings_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_funeral_settings_sections_key" NOT NULL,
  	"heading" varchar,
  	"visible" boolean DEFAULT true
  );
  
  ALTER TABLE "funeral_settings_sections" ADD CONSTRAINT "funeral_settings_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."funeral_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "funeral_settings_sections_order_idx" ON "funeral_settings_sections" USING btree ("_order");
  CREATE INDEX "funeral_settings_sections_parent_id_idx" ON "funeral_settings_sections" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "funeral_settings_sections" CASCADE;
  DROP TYPE "public"."enum_funeral_settings_sections_key";`)
}
