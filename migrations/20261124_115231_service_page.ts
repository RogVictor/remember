import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "services" ADD COLUMN "page_id" integer;
    ALTER TABLE "_services_v" ADD COLUMN "version_page_id" integer;
    ALTER TABLE "services" ADD CONSTRAINT "services_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE SET NULL;
    ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_page_id_pages_id_fk" FOREIGN KEY ("version_page_id") REFERENCES "public"."pages"("id") ON DELETE SET NULL;
    CREATE INDEX "services_page_idx" ON "services" ("page_id");
    CREATE INDEX "_services_v_version_version_page_idx" ON "_services_v" ("version_page_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_services_v" DROP COLUMN "version_page_id";
    ALTER TABLE "services" DROP COLUMN "page_id";
  `)
}
