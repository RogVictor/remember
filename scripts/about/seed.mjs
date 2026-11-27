import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import { sql } from '@payloadcms/db-postgres'
import { digest } from '../content-v4/validate.mjs'

const content = JSON.parse(await readFile(new URL('./content.json', import.meta.url), 'utf8'))
const bundle = new URL('../../content-import/RitualGroup24-V4-final/', import.meta.url)
const legalNames = { legalName: 'Индивидуальный предприниматель Макаров Роман Васильевич', tradeName: 'Ритуал Групп 24' }

function lexical(paragraphs) {
  const base = { version: 1, direction: null, format: '', indent: 0 }
  return { root: { ...base, type: 'root', children: paragraphs.map(text => ({ ...base, type: 'paragraph',
    children: [{ type: 'text', text, version: 1, mode: 'normal', format: 0, detail: 0, style: '' }] })) } }
}
async function heroMedia(payload, req) {
  const manifest = JSON.parse(await readFile(new URL('media-manifest.json', bundle), 'utf8'))
  const asset = manifest.find(item => item.file === 'images/ritualny-agent.webp')
  const filename = 'v4-' + asset.role + '-' + asset.sha256.slice(0, 16) + '-ritualny-agent.webp'
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, depth: 0, limit: 1, req })
  if (existing.docs[0]) return existing.docs[0].id
  const bytes = await readFile(new URL(asset.file, bundle))
  assert.equal(digest(bytes), asset.sha256, 'Проверьте материализацию Git LFS для изображения первого экрана.')
  const doc = await payload.create({ collection: 'media', req, depth: 0, overwriteExistingFiles: false,
    data: { alt: 'Рабочий стол с документами и светлыми цветами', caption: 'Иллюстрация интерьера.' },
    file: { name: filename, data: bytes, size: bytes.length, mimetype: 'image/webp' } })
  return doc.id
}

export async function seedAbout(payload, apply = false) {
  const transactionID = await payload.db.beginTransaction()
  assert.ok(transactionID)
  const req = { transactionID }
  try {
    const db = payload.db.sessions[transactionID].db
    await db.execute(sql`SELECT pg_advisory_xact_lock(24112026, 24)`)
    await db.execute(sql`SELECT id FROM site_seo WHERE route = '/about' FOR UPDATE`)
    const lookup = { collection: 'site-seo', where: { route: { equals: '/about' } }, limit: 1, depth: 0, req }
    const current = (await payload.find({ ...lookup, draft: true })).docs[0]
    if (current?.aboutInitialized || current?.sections?.length) {
      await payload.db.commitTransaction(transactionID)
      return { status: 'already-initialized', id: current.id }
    }

    const sections = structuredClone(content.sections)
    const cards = sections.find(b => b.blockType === 'competencies').items
    const services = await payload.find({ collection: 'services', depth: 0, limit: 0, draft: false, overrideAccess: false, req,
      select: { slug: true, title: true }, where: { _status: { equals: 'published' } } })
    const links = cards.map(card => {
      const exact = services.docs.filter(doc => doc.title.trim().toLowerCase() === card.title.toLowerCase())
      const service = services.docs.find(doc => card.slug && doc.slug === card.slug) || (exact.length === 1 ? exact[0] : null)
      delete card.slug
      card.service = service?.id ?? null
      card.visible = !!service
      return { card: card.title, service: service?.slug ?? null }
    })
    const draft = current?._status === 'draft'
    if (!apply) {
      await payload.db.rollbackTransaction(transactionID)
      return { status: 'dry-run', draft, links }
    }
    const intro = sections.find(b => b.blockType === 'intro')
    intro.body = lexical(intro.paragraphs)
    delete intro.paragraphs
    const hero = sections.find(b => b.blockType === 'hero')
    hero.image = await heroMedia(payload, req)
    hero.alt = 'Светлый кабинет с цветами и документами. Иллюстрация интерьера.'
    const settings = await payload.findGlobal({ slug: 'company-settings', req, depth: 0 })
    if (!settings.id) await payload.updateGlobal({ slug: 'company-settings', data: { legalDetails: legalNames }, req })
    const data = { sections, aboutInitialized: true, _status: draft ? 'draft' : 'published' }
    const result = current ? await payload.update({ collection: 'site-seo', id: current.id, req, data, draft, depth: 0 })
      : await payload.create({ collection: 'site-seo', req, depth: 0, data: { ...data, route: '/about',
          seoTitle: content.seoTitle, seoDescription: content.seoDescription, ogImage: hero.image } })
    await payload.db.commitTransaction(transactionID)
    return { status: draft ? 'draft' : 'published', id: result.id, links, heroImage: hero.image }
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { values } = parseArgs({ options: { apply: { type: 'boolean' }, 'dry-run': { type: 'boolean' } } })
  assert.ok(!(values.apply && values['dry-run']))
  assert.ok(process.env.DATABASE_URL, 'Явно укажите DATABASE_URL целевой базы.')
  process.env.NODE_ENV = 'production'
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../payload.config.ts')
  const payload = await getPayload({ config })
  try { console.log(JSON.stringify(await seedAbout(payload, values.apply), null, 2)) }
  catch (error) { console.error(error); process.exitCode = 1 }
  finally { await payload.destroy() }
  process.exit(process.exitCode || 0)
}
