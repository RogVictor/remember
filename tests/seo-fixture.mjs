import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { migrations } from '../migrations/index.ts'

const url = new URL(process.env.SEO_TEST_DATABASE_URL)
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && /^\/remember_seo_test(?:_[a-z0-9]+)?$/.test(url.pathname),
  'Use an isolated local database named remember_seo_test or remember_seo_test_<suffix>.')
process.env.DATABASE_URL = url.href
process.env.SITE_URL = 'https://example.test'
process.env.PAYLOAD_SECRET = 'seo-fixture-secret-local-only-not-shared'
process.env.NODE_ENV = 'production'

const { default: config } = await import('../payload.config.ts')
const payload = await getPayload({ config })
const phase = process.argv[2] || 'seed'

const paragraph = text => ({ type: 'paragraph', children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
  direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '', version: 1 })
const lexical = (...children) => ({ root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } })
const create = (collection, data) => payload.create({ collection, data })

try {
  if (phase === 'seed') {
    await payload.db.migrate({ migrations: migrations.slice(0, -1) })
    await payload.db.drizzle.execute(sql`
      INSERT INTO media (filename, alt, mime_type, width, height) VALUES ('seo-legacy.png', 'Старый ALT', 'image/png', 1200, 630);
      INSERT INTO pages (title, slug, seo_title, seo_description, og_image_id, _status)
        SELECT 'Старая посадочная', 'seo-legacy', 'Старый Title', 'Старый Description', id, 'published'
        FROM media WHERE filename = 'seo-legacy.png';
      INSERT INTO _pages_v (parent_id, version_title, version_slug, version_seo_title, version_seo_description,
        version_og_image_id, version__status, latest)
        SELECT id, title, slug, seo_title, seo_description, og_image_id, 'published', true FROM pages WHERE slug = 'seo-legacy';
    `)
    await payload.db.migrate({ migrations })
    const legacy = (await payload.find({ collection: 'pages', where: { slug: { equals: 'seo-legacy' } } })).docs[0]
    assert.equal(legacy.seoTitle, 'Старый Title')
    assert.equal(legacy.seoDescription, 'Старый Description')
    assert.equal(legacy.ogImage.alt, 'Старый ALT')
    assert.deepEqual(legacy.targetRegions.map(({ region }) => region), ['Москва', 'Московская область'])
    const versions = await payload.findVersions({ collection: 'pages', where: { parent: { equals: legacy.id } } })
    assert.equal(versions.docs[0].version.seoTitle, 'Старый Title')
    assert.equal(versions.docs[0].version.targetRegions.length, 2)
    const admin = await create('users', { email: 'seo-editor@example.test', password: 'OnlyForLocalSeoFixture-24!', role: 'admin' })
    const servicePage = await create('pages', {
      title: 'Проверочная услуга', slug: 'seo-service', _status: 'published',
      content: lexical(paragraph('Проверочное описание услуги из Lexical.')),
      focusKeyword: '  Ритуальные\t услуги  ', secondaryKeywords: [{ keyword: '  Помощь   семье ' }],
      seoNotes: 'Внутренняя запись', openGraph: { title: 'Заголовок соцсетей', image: legacy.ogImage.id },
    })
    assert.equal(servicePage.focusKeyword, 'Ритуальные услуги')
    assert.equal(servicePage.secondaryKeywords[0].keyword, 'Помощь семье')
    assert.equal(servicePage.targetRegions.length, 2)
    const categoryPage = await create('pages', { title: 'Проверочная категория', slug: 'seo-category', _status: 'published',
      focusKeyword: 'ритуальные услуги' })
    const category = await create('service-categories', { title: 'Проверочная категория', page: categoryPage.id, active: true })
    await create('services', { title: 'Проверочная услуга', slug: 'seo-service', page: servicePage.id,
      serviceCategory: category.id, _status: 'published', seoTitle: 'Резервный Title услуги', priceType: 'on-request' })
    await payload.update({ collection: 'pages', id: categoryPage.id, data: { content: lexical({
      type: 'block', fields: { blockType: 'category-services', category: category.id }, format: '', version: 2,
    }) } })
    await create('site-seo', { route: '/about', _status: 'published', seoTitle: 'Проверочное SEO раздела', robots: { index: false } })
    await create('pages', { title: 'Draft', slug: 'seo-draft', _status: 'draft' })
    await create('pages', { title: 'Duplicate', slug: 'seo-duplicate', _status: 'published',
      canonicalOverride: 'https://example.test/seo-service' })
    const inactivePage = await create('pages', { title: 'Inactive', slug: 'seo-inactive', _status: 'published' })
    await create('service-categories', { title: 'Inactive', page: inactivePage.id, active: false })
    await create('faqs', { question: 'Проверочный вопрос?', answer: 'Проверочный ответ.', _status: 'published' })
    const login = await payload.login({ collection: 'users', data: { email: admin.email, password: 'OnlyForLocalSeoFixture-24!' } })
    const { keywordConflicts } = await import('../src/seo/keywords.ts')
    const response = await keywordConflicts.handler({ user: admin, payload,
      query: { keyword: ' РИТУАЛЬНЫЕ   УСЛУГИ ', id: String(servicePage.id), collection: 'pages' } })
    assert.ok(login.token)
    assert.deepEqual((await response.json()).matches, [{ path: '/seo-category', title: 'Проверочная категория' }])
    assert.equal((await keywordConflicts.handler({ user: null })).status, 401)
    const publicPage = await payload.findByID({ collection: 'pages', id: servicePage.id, overrideAccess: false })
    assert.equal(publicPage.seoNotes, undefined)
    assert.equal(publicPage.focusKeyword, undefined)
    console.log('Legacy metadata and version preserved. SEO, group fields, keyword lookup and access verified.')
  } else if (['unpublish', 'draft-edit', 'publish'].includes(phase)) {
    const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'seo-service' } } })).docs[0]
    const data = phase === 'unpublish' ? { _status: 'draft' } : phase === 'publish' ? { _status: 'published' }
      : { _status: 'draft', seoTitle: 'Неопубликованный SEO Title' }
    await payload.update({ collection: 'pages', id: page.id, data, draft: phase === 'draft-edit' })
  } else if (phase === 'rollback') {
    await payload.db.drizzle.execute(sql`
      INSERT INTO media (filename, alt, decorative) VALUES ('seo-decoration.png', NULL, true) ON CONFLICT (filename) DO NOTHING
    `)
    await payload.db.migrateDown()
    const { rows } = await payload.db.drizzle.execute(sql`SELECT alt FROM media WHERE filename = 'seo-decoration.png'`)
    assert.equal(rows[0].alt, '')
    const legacy = await payload.db.drizzle.execute(sql`SELECT seo_title FROM pages WHERE slug = 'seo-legacy'`)
    assert.equal(legacy.rows[0].seo_title, 'Старый Title')
    console.log('Rollback preserves legacy SEO and restores the ALT constraint.')
  }
} finally {
  await payload.destroy()
}

// Payload's PostgreSQL adapter keeps its reconnect client open after destroy.
process.exit(0)
