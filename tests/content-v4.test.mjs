import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServiceCategoryHeadings, ServiceCategorySection } from '../src/ServiceCategoryGrid.tsx'
import { validateBundle } from '../scripts/content-v4/validate.mjs'

const directory = 'content-import/RitualGroup24-V4-final'

test('published service targets render once as linked H3s and retain the legacy list layout', async () => {
  const { entries, catalog } = await validateBundle(directory)
  const bySlug = new Map(entries.map((r) => [r.page.slug, r]))
  let count = 0
  for (const category of catalog) {
    const services = category.services.map(({ slug }, id) => {
      const { page, service } = bySlug.get(slug)
      return { id, title: service.title, pageTitle: page.title, summary: service.summary }
    })
    const links = new Map(category.services.map(({ slug }, id) => [id, '/' + slug]))
    const group = { title: category.category, services }
    const html = renderToStaticMarkup(createElement(ServiceCategoryHeadings, { group, links }))
    assert.ok(html.includes('<h2>Услуги направления</h2>'))
    assert.ok(!html.includes('<ul>'))
    for (const service of services) {
      assert.ok(html.includes('<h3><a href="' + links.get(service.id) + '">' + service.pageTitle + '</a></h3>'))
    }
    count += [...html.matchAll(/<h3>/g)].length
    const legacy = renderToStaticMarkup(createElement(ServiceCategorySection, { group, links }))
    assert.ok(legacy.includes('<ul>') && !legacy.includes('<h3>'))
    links.clear()
    assert.equal(renderToStaticMarkup(createElement(ServiceCategoryHeadings, { group, links })), '')
  }
  assert.equal(count, 44)
})

test('dry-run rejects a placeholder internal document ID in otherwise consistent JSON files', async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'remember-v4-validation-'))
  assert.equal(path.dirname(path.resolve(tmp)), path.resolve(os.tmpdir()))
  t.after(() => fs.rm(tmp, { recursive: true, force: true }))
  for (const file of await fs.readdir(directory)) {
    if (file.endsWith('.json') || ['images', 'og', 'source-images'].includes(file)) {
      await fs.cp(path.join(directory, file), path.join(tmp, file), { recursive: true })
    }
  }
  for (const name of ['import-all.json', '01-organizaciya-pohoron.json']) {
    const target = path.join(tmp, name)
    const data = JSON.parse(await fs.readFile(target, 'utf8'))
    const link = data[0].page.content.root.children.flatMap((n) => n.children || []).find((n) => n.type === 'link')
    link.fields.doc.value = -1
    await fs.writeFile(target, JSON.stringify(data))
  }
  await assert.rejects(validateBundle(tmp), /organizaciya-pohoron link/)
})
