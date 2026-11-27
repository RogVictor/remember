import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { migrations } from '../migrations/index.ts'
import { seedAbout } from '../scripts/about/seed.mjs'

const uri = new URL(process.env.DATABASE_URL)
assert.ok(['localhost', '127.0.0.1'].includes(uri.hostname) && /^\/remember_about_legacy_test(?:_\w+)?$/.test(uri.pathname))
assert.ok(process.env.PAYLOAD_MEDIA_DIR && process.env.NODE_ENV === 'production')
const { default: config } = await import('../payload.config.ts')
const payload = await getPayload({ config })
try {
  const db = payload.db.drizzle
  assert.equal((await db.execute(sql`SELECT to_regclass('public.site_seo') AS name`)).rows[0].name, null, 'Используйте пустую локальную базу.')
  const idx = migrations.findIndex(m => m.name.endsWith('_about_page'))
  assert.ok(idx > 0)
  await payload.db.migrate({ migrations: migrations.slice(0, idx) })
  await db.execute(sql`
    INSERT INTO company_settings (company_name,city,phone) VALUES ('Существующее название','Москва','+7 (000) 000-00-08');
    INSERT INTO site_seo (route,seo_title,_status) VALUES ('/about','Опубликованный Title','published');
    INSERT INTO _site_seo_v (parent_id,version_route,version_seo_title,version__status,version_created_at,version_updated_at,latest)
      SELECT id,'/about','Отложенный Title','draft',created_at,updated_at,true FROM site_seo WHERE route='/about';
    INSERT INTO pages (title,slug,_status) VALUES ('Существующая страница','legacy-page','published');
  `)
  await payload.db.migrate({ migrations })
  const result = await seedAbout(payload, true)
  assert.equal(result.status, 'draft')
  const read = draft => payload.findByID({ collection: 'site-seo', id: result.id, draft, depth: 0 })
  assert.equal((await read(false)).seoTitle, 'Опубликованный Title')
  const draft = await read(true)
  assert.equal(draft.seoTitle, 'Отложенный Title')
  assert.equal(draft.sections.length, 8)
  const settings = await payload.findGlobal({ slug: 'company-settings' })
  assert.equal(settings.companyName, 'Существующее название')
  assert.equal(settings.phone, '+7 (000) 000-00-08')
  assert.equal(settings.legalDetails.confirmed, false)
  assert.ok(settings.legalDetails.legalName.includes('Макаров'))
  assert.equal((await payload.count({ collection: 'pages', where: { slug: { equals: 'legacy-page' } } })).totalDocs, 1)
  await payload.update({ collection: 'site-seo', id: result.id, data: { sections: [], seoTitle: '', _status: 'published' } })
  assert.equal((await seedAbout(payload, true)).status, 'already-initialized')
  assert.equal((await read(false)).sections.length, 0)
  assert.ok(!(await read(false)).seoTitle)
  await payload.db.migrate({ migrations })
  console.log('Старые контакты, страница, версии SEO и намеренно очищенные поля сохранены.')
} finally { await payload.destroy() }
process.exit(0)
