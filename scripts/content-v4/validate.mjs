import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { landingPath } from '../../src/seo/routes.ts'
import { inspectContent } from '../../src/seo/content.ts'
import { keywordKey } from '../../src/seo/model.ts'

export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const catalogDigest = '408a7b6b3de17fe9e6427d6e89ffd154feb7de024606d9ea98c4a5b8ab6ec0c7'
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0
const requireText = (value, label) => assert.ok(nonempty(value), label)
const distinct = (list, label) => assert.equal(new Set(list).size, list.length, label)
const same = (left, right, label) => assert.deepEqual(left, right, label)
const visible = (node) => (node.type === 'text' ? node.text : (node.children || []).map(visible).join(''))
function allowed(object, keys, label) {
  assert.ok(object && typeof object === 'object' && !Array.isArray(object), label)
  assert.ok(
    Object.keys(object).every((key) => keys.includes(key)),
    'Unexpected field in ' + label,
  )
}

export async function validateBundle(directory) {
  const root = await fs.realpath(directory)
  const read = async (name) => JSON.parse(await fs.readFile(path.join(root, name), 'utf8'))
  const [entries, catalog, manifest, headings, semantics] = await Promise.all(
    [
      'import-all.json',
      'service-catalog.json',
      'media-manifest.json',
      'heading-links.json',
      'seo-keyword-map.json',
    ].map(read),
  )
  // The fingerprint covers the approved V2 directory, including order and short card labels.
  same(digest(JSON.stringify(catalog)), catalogDigest, 'Approved directory changed')
  const expectedOrder = catalog.flatMap((g) => [g.categorySlug, ...g.services.map((s) => s.slug)])
  same(
    entries.map((r) => r.page.slug),
    expectedOrder,
    'Page slugs and order',
  )
  const bySlug = new Map(entries.map((r) => [r.page.slug, r]))
  const assets = new Map()
  for (const asset of manifest) {
    const { file, slug, role, sha256, alt } = asset
    assert.ok(bySlug.has(slug) && ['cover', 'extra', 'og'].includes(role), 'Media owner or role: ' + file)
    const folder = role === 'og' ? 'og' : 'images'
    assert.ok(
      new RegExp('^' + folder + '/' + slug + (role === 'extra' ? '-[a-z0-9-]+' : '') + '\\.webp$').test(file),
      'Media filename: ' + file,
    )
    assert.ok(!assets.has(file), 'Duplicate media path: ' + file)
    const real = await fs.realpath(path.join(root, file))
    assert.ok(
      !path.relative(root, real).startsWith('..') && !path.isAbsolute(path.relative(root, real)),
      'Media outside bundle',
    )
    const bytes = await fs.readFile(real)
    same(bytes.length, asset.bytes, 'File size: ' + file)
    same(digest(bytes), sha256, 'SHA-256: ' + file)
    if (asset.sourceFile) {
      same(asset.sourceFile, 'source-images/' + path.basename(file), 'Original image: ' + file)
      same(digest(await fs.readFile(path.join(root, asset.sourceFile))), asset.sourceSha256, asset.sourceFile)
    }
    const metadata = await sharp(bytes).metadata()
    same([metadata.format, metadata.width, metadata.height], ['webp', asset.width, asset.height], file)
    if (role === 'og') same([asset.width, asset.height], [1200, 630], file)
    requireText(alt, file + ' ALT')
    assets.set(file, asset)
  }
  same(
    ['cover', 'extra', 'og'].map((role) => manifest.filter((m) => m.role === role).length),
    [54, 20, 54],
    'Media counts',
  )
  distinct(
    manifest.filter((m) => m.role !== 'og').map((m) => m.sha256),
    'Duplicate illustration',
  )
  const report = [],
    expectedHeadings = [],
    expectedSemantics = []
  for (const [g, group] of catalog.entries()) {
    const slugs = [group.categorySlug, ...group.services.map((s) => s.slug)]
    same(
      await read(String(g + 1).padStart(2, '0') + '-' + group.categorySlug + '.json'),
      slugs.map((s) => bySlug.get(s)),
      'Category JSON: ' + group.categorySlug,
    )
    for (const [i, slug] of slugs.entries()) {
      const row = bySlug.get(slug),
        page = row.page,
        category = i === 0
      same(row.kind, category ? 'category' : 'service', slug)
      allowed(row, ['kind', 'page', row.kind], slug)
      assert.ok(landingPath(slug), 'Reserved slug: ' + slug)
      for (const field of ['title', 'seoTitle', 'seoDescription', 'focusKeyword', 'seoNotes'])
        requireText(page[field], slug + '.' + field)
      allowed(
        page,
        [
          'title',
          'slug',
          '_status',
          'seoTitle',
          'seoDescription',
          'focusKeyword',
          'secondaryKeywords',
          'relatedKeywords',
          'targetRegions',
          'searchIntent',
          'seoNotes',
          'robots',
          'schemaType',
          'canonicalOverride',
          'ogImage',
          'openGraph',
          'content',
        ],
        slug,
      )
      same(page._status, 'draft', slug)
      same(page.robots, { index: false, follow: false }, slug + ' robots')
      same(page.schemaType, category ? 'OfferCatalog' : 'Service', slug)
      same(page.canonicalOverride, null, 'Canonical must use the existing landing route')
      same(
        page.targetRegions.map((x) => x.region),
        ['Москва', 'Московская область'],
        slug,
      )
      assert.ok(
        ['commercial', 'transactional', 'informational', 'mixed', 'navigational'].includes(page.searchIntent),
        slug,
      )
      for (const key of ['relatedKeywords', 'secondaryKeywords']) {
        assert.ok(Array.isArray(page[key]) && page[key].length > 0, key)
        for (const item of page[key]) {
          allowed(item, ['keyword'], key)
          requireText(item.keyword, key)
        }
      }
      allowed(page.openGraph, ['title', 'description', 'image'], slug + ' Open Graph')
      requireText(page.openGraph.title, slug)
      requireText(page.openGraph.description, slug)
      same(page.ogImage, 'images/' + slug + '.webp', slug)
      same(page.openGraph.image, 'og/' + slug + '.webp', slug)
      if (category) same(row.category, { title: group.category, active: false }, slug)
      else {
        const card = group.services[i - 1]
        allowed(
          row.service,
          ['title', 'slug', 'sortOrder', 'serviceCategory', 'summary', 'image', 'priceType', '_status'],
          slug,
        )
        same(
          [
            row.service.title,
            row.service.slug,
            row.service.sortOrder,
            row.service.serviceCategory,
            row.service.priceType,
            row.service._status,
            row.service.image,
          ],
          [
            card.title,
            slug,
            (g + 1) * 100 + card.sortOrder,
            group.categorySlug,
            'on-request',
            'draft',
            page.ogImage,
          ],
          slug,
        )
        requireText(row.service.summary, slug + ' summary')
      }
      const { title, focusKeyword, secondaryKeywords, relatedKeywords, searchIntent } = page
      expectedSemantics.push({ slug, title, focusKeyword, secondaryKeywords, relatedKeywords, searchIntent })
      const targets = [],
        uploads = [],
        body = [title],
        nodes = page.content?.root?.children
      assert.ok(
        Array.isArray(nodes) && page.content.root.type === 'root' && page.content.root.version === 1,
        slug + ' root',
      )
      let sections = 0,
        callbacks = 0
      function checkInline(node, insideLink = false) {
        if (node.type === 'text') {
          requireText(node.text, slug + ' text')
          same(node.version, 1, slug)
          return
        }
        assert.ok(
          !insideLink &&
            node.type === 'link' &&
            node.version === 3 &&
            Array.isArray(node.children) &&
            node.children.length,
          slug + ' inline',
        )
        const { linkType, doc } = node.fields
        allowed(node.fields, ['linkType', 'doc', 'newTab'], slug + ' link fields')
        allowed(doc, ['relationTo', 'value'], slug + ' link target')
        assert.ok(
          linkType === 'internal' &&
            doc.relationTo === 'pages' &&
            bySlug.has(doc.value) &&
            doc.value !== slug,
          slug + ' link',
        )
        targets.push(doc.value)
        node.children.forEach((child) => checkInline(child, true))
      }
      for (const n of nodes) {
        if (n.type === 'block') {
          same(n.version, 2, slug + ' block')
          if (n.fields.blockType === 'category-services') {
            assert.ok(category, slug)
            same(n.fields, { blockType: 'category-services', category: slug, layout: 'sections' }, slug)
            sections++
            body.push('Услуги направления')
            for (const service of group.services) {
              const target = bySlug.get(service.slug)
              body.push(target.page.title, target.service.summary)
              expectedHeadings.push({
                category: slug,
                service: service.slug,
                title: target.page.title,
                href: landingPath(service.slug),
              })
            }
          } else {
            same(n.fields, { blockType: 'callback-form' }, slug)
            callbacks++
          }
        } else if (n.type === 'upload') {
          same(n.fields, {}, slug + ' upload fields')
          const m = assets.get(n.value)
          assert.ok(
            n.version === 3 && n.relationTo === 'media' && m?.slug === slug && m.role !== 'og',
            slug + ' image',
          )
          uploads.push(n.value)
        } else {
          assert.ok(
            n.version === 1 &&
              (n.type === 'paragraph' || (n.type === 'heading' && ['h2', 'h3'].includes(n.tag))),
            slug + ' Lexical element',
          )
          assert.ok(Array.isArray(n.children) && n.children.length, slug + ' children')
          n.children.forEach((child) => checkInline(child))
          body.push(visible(n))
        }
      }
      same([sections, callbacks], [category ? 1 : 0, 1], slug + ' blocks')
      const expectedMedia = manifest
        .filter((m) => m.slug === slug && m.role !== 'og')
        .map((m) => m.file)
        .sort()
      same(uploads.sort(), expectedMedia, slug + ' media bindings')
      same(assets.get(page.openGraph.image)?.derivedFrom, page.ogImage, slug + ' OG source')
      assert.ok(targets.length >= 1 && targets.length <= 5, slug + ' contextual links')
      const analysis = inspectContent(page.content)
      same(analysis.links.length, targets.length, slug + ' SEO content reader')
      const faqStart = nodes.findIndex((n) => n.tag === 'h2' && visible(n) === 'Частые вопросы')
      assert.ok(faqStart >= 0, slug + ' FAQ')
      const questions = nodes.slice(faqStart + 1).filter((n) => n.type !== 'block')
      for (let j = 0; j < questions.length; j += 2)
        assert.ok(
          questions[j].tag === 'h3' &&
            visible(questions[j]).endsWith('?') &&
            questions[j + 1]?.type === 'paragraph',
          slug + ' FAQ pair',
        )
      distinct(questions.filter((_, j) => j % 2 === 0).map(visible), slug + ' duplicate FAQ')
      const faq = questions.length / 2
      assert.ok(faq >= (category ? 10 : 8) && faq <= (category ? 15 : 12), slug + ' FAQ count')
      const characters = body.join('\n').length
      assert.ok(
        characters >= (category ? 7000 : 5000) && characters <= (category ? 10000 : 8000),
        slug + ' visible text: ' + characters,
      )
      report.push({
        slug,
        title,
        kind: row.kind,
        characters,
        faq,
        images: uploads.length,
        headingLinks: category ? group.services.length : 0,
        contextLinks: targets.length,
        contextTargets: targets,
      })
    }
  }
  same(expectedHeadings, headings, 'Clickable headings')
  same(expectedSemantics, semantics, 'SEO map')
  for (const key of ['focusKeyword', 'seoTitle', 'seoDescription'])
    distinct(
      entries.map((r) => keywordKey(r.page[key])),
      key,
    )
  return { root, entries, catalog, assets, report }
}
