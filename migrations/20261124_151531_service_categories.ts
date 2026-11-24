import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "service_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "active" boolean DEFAULT true,
      "page_id" integer,
      "link_slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "services" ADD COLUMN "service_category_id" integer;
    ALTER TABLE "_services_v" ADD COLUMN "version_service_category_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "service_categories_id" integer;
    ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
    CREATE UNIQUE INDEX "service_categories_title_idx" ON "service_categories" USING btree ("title");
    CREATE INDEX "service_categories_page_idx" ON "service_categories" USING btree ("page_id");
    CREATE INDEX "service_categories_updated_at_idx" ON "service_categories" USING btree ("updated_at");
    CREATE INDEX "service_categories_created_at_idx" ON "service_categories" USING btree ("created_at");
    ALTER TABLE "services" ADD CONSTRAINT "services_service_category_id_service_categories_id_fk" FOREIGN KEY ("service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_service_category_id_service_categories_id_fk" FOREIGN KEY ("version_service_category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_categories_fk" FOREIGN KEY ("service_categories_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "services_service_category_idx" ON "services" USING btree ("service_category_id");
    CREATE INDEX "_services_v_version_version_service_category_idx" ON "_services_v" USING btree ("version_service_category_id");
    CREATE INDEX "payload_locked_documents_rels_service_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("service_categories_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "services" DROP COLUMN "service_category_id";
    ALTER TABLE "_services_v" DROP COLUMN "version_service_category_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "service_categories_id";
    DROP TABLE "service_categories";
  `)
}
