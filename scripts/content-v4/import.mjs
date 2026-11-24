import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import sharp from 'sharp'
import { validateBundle, digest } from './validate.mjs'

const { values: options } = parseArgs({
  options: {
    bundle: { type: 'string', default: 'content-import/RitualGroup24-V4-final' },
    apply: { type: 'boolean' },
    'dry-run': { type: 'boolean' },
    database: { type: 'boolean' },
    'update-drafts': { type: 'boolean' },
    'confirm-update': { type: 'boolean' },
  },
})
const stats = { created: {}, updated: {}, skipped: {} }
const count = (action, collection) => {
  stats[action][collection] = (stats[action][collection] || 0) + 1
}
let payload,
  stage = 'arguments'
function id(map, key) {
  const value = map.get(key)
  assert.ok(Number.isSafeInteger(value) && value > 0, 'Unresolved relationship: ' + key)
  return value
}
function uploadName(asset) {
  return 'v4-' + asset.role + '-' + asset.sha256.slice(0, 16) + '-' + path.basename(asset.file)
}
function resolveContent(content, pages, categories, media) {
  const result = structuredClone(content)
  const visit = (n) => {
    if (n.type === 'link') n.fields.doc.value = id(pages, n.fields.doc.value)
    if (n.type === 'upload') n.value = id(media, n.value)
    if (n.fields?.blockType === 'category-services') n.fields.category = id(categories, n.fields.category)
    n.children?.forEach(visit)
  }
  visit(result.root)
  return result
}
async function connect() {
  const raw = process.env.CONTENT_IMPORT_DATABASE_URL
  assert.ok(raw, 'Set CONTENT_IMPORT_DATABASE_URL to the explicitly selected local test database')
  const url = new URL(raw)
  assert.ok(
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      /^\/[\w-]+$/.test(url.pathname) &&
      !url.search &&
      !url.hash,
    'Expected an explicit loopback PostgreSQL URL without connection overrides',
  )
  process.env.DATABASE_URL = url.href
  process.env.PAYLOAD_DROP_DATABASE = 'false'
  const [{ getPayload }, { default: configPromise }] = await Promise.all([
    import('payload'),
    import('../../payload.config.ts'),
  ])
  const config = await configPromise
  const initAdapter = config.db.init
  config.db = {
    ...config.db,
    init: (args) => {
      const adapter = initAdapter(args)
      adapter.push = false
      adapter.disableCreateDatabase = true
      return adapter
    },
  }
  if (process.env.CONTENT_IMPORT_MEDIA_DIR) {
    const upload = config.collections.find((c) => c.slug === 'media').upload
    upload.staticDir = path.resolve(process.env.CONTENT_IMPORT_MEDIA_DIR)
  }
  return getPayload({ config })
}
async function existing(collection, field, keys, req) {
  const options = {
    collection,
    where: { [field]: { in: keys } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  }
  const result = new Map()
  const drafts = ['pages', 'services'].includes(collection)
  for (const draft of drafts ? [false, true] : [false]) {
    const previous = new Map([...result.values()].map((doc) => [doc.id, doc[field]]))
    const where = previous.size
      ? { or: [options.where, { id: { in: [...previous.keys()] } }] }
      : options.where
    const { docs } = await payload.find({ ...options, where, draft })
    for (const doc of docs) {
      if (previous.has(doc.id))
        assert.equal(doc[field], previous.get(doc.id), 'Draft slug conflict: ' + previous.get(doc.id))
      assert.ok(
        !result.has(doc[field]) || result.get(doc[field]).id === doc.id,
        'Ambiguous ' + collection + ' ' + doc[field],
      )
      result.set(doc[field], doc)
    }
  }
  return result
}
async function getState(bundle, req) {
  const slugs = bundle.entries.map((r) => r.page.slug)
  return {
    pages: await existing('pages', 'slug', slugs, req),
    categories: await existing(
      'service-categories',
      'title',
      bundle.catalog.map((g) => g.category),
      req,
    ),
    services: await existing('services', 'slug', slugs, req),
  }
}
function checkState(bundle, state) {
  for (const row of bundle.entries) {
    const { slug } = row.page
    const page = state.pages.get(slug)
    const card = row.service ? state.services.get(slug) : state.categories.get(row.category.title)
    if (card) {
      assert.equal(card.page, page?.id, 'Existing card has a different or missing landing: ' + slug)
      if (row.service) {
        const category = bundle.catalog.find((g) => g.categorySlug === row.service.serviceCategory)
        assert.equal(
          card.serviceCategory,
          state.categories.get(category.category)?.id,
          'Existing category conflict: ' + slug,
        )
      }
    }
  }
}
async function importMedia(bundle, records, needed) {
  const media = new Map()
  for (const asset of bundle.assets.values()) {
    stage = 'media ' + asset.file
    const filename = uploadName(asset),
      old = records.get(filename)
    if (old) {
      media.set(asset.file, old.id)
      count('skipped', 'media')
      continue
    }
    if (!needed.has(asset.file)) continue
    const data = await fs.readFile(path.join(bundle.root, asset.file))
    assert.equal(digest(data), asset.sha256, 'Asset changed after validation')
    const doc = await payload.create({
      collection: 'media',
      depth: 0,
      overwriteExistingFiles: false,
      data: {
        alt: asset.alt,
        decorative: false,
        caption: 'Иллюстрация, созданная генеративным инструментом.',
      },
      file: { name: filename, data, mimetype: 'image/webp', size: data.length },
    })
    assert.equal(doc.filename, filename, 'Media filename collision: ' + filename)
    media.set(asset.file, doc.id)
    count('created', 'media')
  }
  return media
}
async function applyGraph(bundle, media) {
  const req = { transactionID: await payload.db.beginTransaction() }
  assert.ok(req.transactionID, 'PostgreSQL transaction unavailable')
  try {
    const state = await getState(bundle, req)
    checkState(bundle, state)
    const pages = new Map(),
      categories = new Map(),
      editable = new Set()
    for (const { page } of bundle.entries) {
      stage = 'page ' + page.slug
      const old = state.pages.get(page.slug)
      if (old) {
        pages.set(page.slug, old.id)
        if (options['update-drafts'] && old._status === 'draft') {
          editable.add(page.slug)
          count('updated', 'pages')
        } else count('skipped', 'pages')
      } else {
        const doc = await payload.create({
          collection: 'pages',
          data: { slug: page.slug, title: page.title, _status: 'draft' },
          draft: true,
          depth: 0,
          req,
        })
        pages.set(page.slug, doc.id)
        editable.add(page.slug)
        count('created', 'pages')
      }
    }
    for (const { category, page } of bundle.entries.filter((r) => r.category)) {
      stage = 'category ' + page.slug
      const old = state.categories.get(category.title)
      const doc =
        old ??
        (await payload.create({
          collection: 'service-categories',
          data: { ...category, page: id(pages, page.slug) },
          depth: 0,
          req,
        }))
      categories.set(page.slug, doc.id)
      count(old ? 'skipped' : 'created', 'service-categories')
    }
    for (const { service, page } of bundle.entries.filter((r) => r.service)) {
      stage = 'service ' + page.slug
      const old = state.services.get(service.slug)
      if (old && !(options['update-drafts'] && old._status === 'draft')) {
        count('skipped', 'services')
        continue
      }
      const data = {
        ...service,
        page: id(pages, page.slug),
        image: id(media, service.image),
        serviceCategory: id(categories, service.serviceCategory),
      }
      const args = { collection: 'services', data, draft: true, depth: 0, req }
      if (old) await payload.update({ ...args, id: old.id })
      else await payload.create(args)
      count(old ? 'updated' : 'created', 'services')
    }
    for (const { page } of bundle.entries) {
      if (!editable.has(page.slug)) continue
      stage = 'page content ' + page.slug
      const data = {
        ...page,
        ogImage: id(media, page.ogImage),
        openGraph: { ...page.openGraph, image: id(media, page.openGraph.image) },
        content: resolveContent(page.content, pages, categories, media),
      }
      await payload.update({
        collection: 'pages',
        id: id(pages, page.slug),
        data,
        draft: true,
        depth: 0,
        req,
      })
    }
    await payload.db.commitTransaction(req.transactionID)
  } catch (error) {
    await payload.db.rollbackTransaction(req.transactionID)
    throw error
  }
}
async function run() {
  assert.ok(!(options.apply && options['dry-run']), 'Select one import mode')
  assert.ok(
    Boolean(options['update-drafts']) === Boolean(options['confirm-update']),
    'Updating drafts requires both --update-drafts and --confirm-update',
  )
  stage = 'package validation'
  const bundle = await validateBundle(options.bundle)
  const summary = {
    pages: bundle.entries.length,
    categories: bundle.catalog.length,
    services: 44,
    media: bundle.assets.size,
    headingLinks: bundle.report.reduce((sum, r) => sum + r.headingLinks, 0),
    contextLinks: bundle.report.reduce((sum, r) => sum + r.contextLinks, 0),
  }
  if (!options.apply && !options.database) {
    console.log(JSON.stringify({ mode: 'offline dry-run', ...summary }))
    return
  }
  stage = 'local database preflight'
  payload = await connect()
  const state = await getState(bundle)
  checkState(bundle, state)
  const mediaRecords = await existing('media', 'filename', [...bundle.assets.values()].map(uploadName))
  const mediaDir = payload.collections.media.config.upload.staticDir
  const needed = new Set()
  for (const row of bundle.entries) {
    const page = state.pages.get(row.page.slug),
      service = state.services.get(row.page.slug)
    if (!page || (options['update-drafts'] && page._status === 'draft')) {
      for (const asset of bundle.assets.values()) if (asset.slug === row.page.slug) needed.add(asset.file)
    }
    if (row.service && (!service || (options['update-drafts'] && service._status === 'draft')))
      needed.add(row.service.image)
  }
  for (const asset of bundle.assets.values()) {
    const name = uploadName(asset),
      doc = mediaRecords.get(name)
    if (doc) {
      stage = 'existing media ' + name
      const actual = await fs.readFile(path.join(mediaDir, name))
      const hash = digest(actual)
      if (hash !== asset.sha256) {
        // Payload processes WebP through its auto-rotating Sharp upload pipeline.
        const encoded = await sharp(path.join(bundle.root, asset.file), { animated: true })
          .rotate()
          .toBuffer()
        assert.equal(hash, digest(encoded), 'Existing file differs: ' + name)
      }
    } else if (needed.has(asset.file)) {
      let occupied = true
      try {
        await fs.access(path.join(mediaDir, name))
      } catch (e) {
        if (e.code !== 'ENOENT') throw e
        occupied = false
      }
      assert.ok(!occupied, 'Unmanaged file occupies ' + name)
    }
  }
  if (!options.apply) {
    console.log(
      JSON.stringify({
        mode: 'database dry-run',
        ...summary,
        existing: {
          pages: state.pages.size,
          services: state.services.size,
          categories: state.categories.size,
          media: mediaRecords.size,
        },
        mediaNeeded: needed.size,
      }),
    )
    return
  }
  // Serialize writers using the same local media store. The DB transaction also protects the relationship graph.
  await fs.mkdir(mediaDir, { recursive: true })
  const lock = path.join(mediaDir, '.v4-import.lock')
  const handle = await fs.open(lock, 'wx')
  try {
    await handle.writeFile(String(process.pid))
    const refreshed = await existing('media', 'filename', [...bundle.assets.values()].map(uploadName))
    const media = await importMedia(bundle, refreshed, needed)
    await applyGraph(bundle, media)
  } finally {
    await handle.close()
    await fs.unlink(lock)
  }
  console.log(JSON.stringify({ mode: 'apply', ...summary, ...stats }))
}
try {
  await run()
} catch (error) {
  console.error(JSON.stringify({ stage, error: error.message, details: error.data?.errors }, null, 2))
  process.exitCode = 1
} finally {
  if (payload) await payload.destroy()
}
// Payload can leave background timers alive after the database pool is disposed.
process.exit(process.exitCode || 0)
