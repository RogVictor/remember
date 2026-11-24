import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "company_settings" ADD COLUMN "hero_image_id" integer;
    ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL;
    CREATE INDEX "company_settings_hero_image_idx" ON "company_settings" ("hero_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "company_settings" DROP COLUMN "hero_image_id";
  `)
}
