import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { setTimeout as pause } from 'node:timers/promises'
import { getPayload } from 'payload'
import { seedAbout } from '../scripts/about/seed.mjs'
import { externalLink } from '../src/about/links.ts'
import { isAboutIcon } from '../src/about/icons.ts'

test('разрешённые ссылки и реестр иконок', () => {
  for (const input of ['javascript:alert(1)', '//invalid.test', 'http://example.test', 'https://name:password@example.test', 'https://test\\@example.test']) assert.equal(externalLink(input), null)
  assert.equal(externalLink('https://example.test/help'), 'https://example.test/help')
  assert.ok(isAboutIcon('Clock'))
  assert.ok(!isAboutIcon('constructor'))
})

test('публикация, связанные записи, файлы, SEO и повторное наполнение', async t => {
  const db = new URL(process.env.ABOUT_TEST_DATABASE_URL)
  const socket = createServer()
  assert.ok(['localhost','127.0.0.1'].includes(db.hostname) && /^\/remember_about_test(?:_\w+)?$/.test(db.pathname))
  socket.listen(0, '127.0.0.1')
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  const base = new URL('http://127.0.0.1:' + port)
  assert.equal(process.env.DATABASE_URL, db.href)
  assert.ok(process.env.PAYLOAD_MEDIA_DIR, 'Выберите отдельный каталог тестовых файлов.')
  const { default: config } = await import('../payload.config.ts')
  const payload = await getPayload({ config })
  t.after(() => payload.destroy())
  const get = path => fetch(new URL(path, base), { headers: { 'User-Agent': 'Googlebot' }, redirect: 'manual' })
  const child = spawn(process.execPath, ['./node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    windowsHide: true, stdio: 'ignore', env: { ...process.env, SMTP_HOST: '', TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_BOT_TOKEN: '', TELEGRAM_CHAT_GROUP_ID: '' },
  })
  t.after(async () => { if (child.exitCode === null && !child.signalCode) { const exit = once(child, 'exit'); child.kill(); await exit } })
  for (let i = 0; i < 100; i++) {
    if (await get('/api/health').then(r => r.ok, () => false)) break
    await pause(150)
  }
  const html = async (path = '/about') => {
    const response = await get(path)
    assert.equal(response.status, 200, path)
    return response.text()
  }
  const create = (collection, data) => payload.create({ collection, data, depth: 0 })
  const publicRead = { overrideAccess: false, draft: false, depth: 0 }
  assert.equal((await payload.count({ collection: 'site-seo' })).totalDocs, 0, 'Используйте отдельную свежую базу.')
  assert.equal((await get('/about')).status, 404)
  const catalog = JSON.parse(await readFile(new URL('../content-import/RitualGroup24-V4-final/service-catalog.json', import.meta.url)))
  const data = JSON.parse(await readFile(new URL('../scripts/about/content.json', import.meta.url)))
  const serviceRows = new Map()
  for (const card of data.sections.find(b => b.blockType === 'competencies').items.filter(c => c.slug)) {
    const match = catalog.flatMap(g => g.services).find(s => s.slug === card.slug)
    assert.ok(match, card.slug)
    const page = await create('pages', { title: match.title, slug: match.slug, _status: 'published' })
    const service = await create('services', { title: match.title, slug: match.slug, page: page.id, _status: 'published' })
    serviceRows.set(match.slug, { page, service })
  }
  const { links } = await seedAbout(payload)
  assert.equal(links.filter(l => l.service).length, 7)
  const [first, repeat] = await Promise.all([seedAbout(payload, true), seedAbout(payload, true)])
  assert.deepEqual([first.status, repeat.status].sort(), ['already-initialized','published'])
  const id = first.id
  const load = () => payload.findByID({ collection: 'site-seo', id, depth: 0 })
  const saved = await load()
  assert.equal(saved.sections.length, 8)
  const legalSettings = await payload.findGlobal({ slug: 'company-settings', depth: 0 })
  assert.ok(legalSettings.legalDetails.legalName.includes('Макаров'))
  assert.ok(!legalSettings.legalDetails.confirmed)
  await payload.updateGlobal({ slug: 'company-settings', data: { companyName: 'Ритуал Групп 24', phone: '+7 (000) 000-00-02' } })
  const edit = (data, draft = false) => payload.update({ collection: 'site-seo', id, depth: 0, draft, data })
  const baseline = await html('/about?utm_source=fixture')
  assert.equal((baseline.match(/<h1[ >]/g) || []).length, 1)
  for (const title of ['О нашей компании','Почему семьи обращаются к нам','Чем мы можем помочь','Как мы работаем']) assert.ok(baseline.includes(title))
  assert.ok(!baseline.includes('Координатор ритуальных мероприятий') && !baseline.includes('Макаров'))
  assert.ok(baseline.includes('<title>' + data.seoTitle + '</title>'))
  const origin = process.env.SITE_URL
  assert.ok(baseline.includes('rel="canonical" href="' + origin + '/about"'))
  assert.ok(baseline.includes('property="og:url" content="' + origin + '/about"'))
  assert.ok(baseline.includes('property="og:image"'))
  const graph = JSON.parse(baseline.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph']
  assert.equal(graph.filter(n => ['Organization', 'FuneralHome'].includes(n['@type'])).length, 1)
  assert.ok(graph.some(n => n['@type'] === 'AboutPage' && n.about['@id'].endsWith('#organization')))
  assert.deepEqual(graph.find(n => n['@type'] === 'BreadcrumbList').itemListElement.map(v => v.name), ['Главная','О компании'])
  assert.equal((await get('/about/')).status, 308)
  assert.equal((await html('/sitemap.xml')).split('<loc>' + origin + '/about</loc>').length - 1, 1)
  assert.ok((await html('/robots.txt')).includes('Allow: /'))
  const api = await (await get('/api/site-seo/' + id + '?depth=3&draft=true')).json()
  assert.equal(api.sections?.length ?? 0, 0)
  assert.equal((await (await get('/api/globals/company-settings')).json()).legalDetails, undefined)
  assert.ok([401,403].includes((await fetch(new URL('/api/site-seo/' + id, base), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"seoTitle":"denied"}' })).status))

  const controlRoutes = ['/', '/contacts', '/services', '/products', '/info', '/pohorony-pod-klyuch']
  const seoTags = markup => [...markup.matchAll(/<title>[^<]*<\/title>|<link rel="canonical"[^>]*>|<meta (?:name="(?:description|robots)"|property="og:[^"]+")[^>]*>/g)].map(match => match[0])
  const before = await Promise.all(controlRoutes.map(async path => seoTags(await html(path))))
  const lead = await fetch(new URL('/api/leads', base), { method: 'POST',
    headers: { 'Content-Type': 'application/json', origin, 'x-real-ip': '192.0.2.24' },
    body: JSON.stringify({ name: 'Тест страницы', phone: '+70000000002', personalDataConsent: true, requestType: 'callback', source: '/about' }) })
  assert.ok(lead.ok)
  assert.equal((await payload.count({ collection: 'leads', where: { source: { equals: '/about' } } })).totalDocs, 1)

  const updated = structuredClone(saved.sections)
  const team = updated.find(b => b.blockType === 'team')
  team.visible = true
  team.items[0].image = updated.find(b => b.blockType === 'hero').image
  team.items[0].illustrative = true
  team.items[1].visible = false
  const hero = updated.find(b => b.blockType === 'hero')
  hero.visible = false
  const steps = updated.find(b => b.blockType === 'steps')
  steps.items.reverse()
  steps.items[0].visible = false
  const intro = updated.find(b => b.blockType === 'intro')
  intro.body.root.children[0].children[0].text = 'Текст для проверки публикации'
  const benefits = updated.find(b => b.blockType === 'benefits')
  benefits.items[0].icon = 'Flame'
  benefits.items.reverse()
  updated.reverse()
  await edit({ sections: updated, seoTitle: 'Тест новой версии', robots: { index: false }, _status: 'draft' }, true)
  assert.ok(!(await html()).includes('Текст для проверки публикации'))
  await edit({ sections: updated, seoTitle: 'Тест новой версии', robots: { index: false }, _status: 'published' })
  const changed = await html()
  assert.ok(changed.includes('<title>Тест новой версии</title>') && changed.includes('Текст для проверки публикации'))
  assert.equal((changed.match(/<h1[ >]/g) || []).length, 1)
  assert.ok(!changed.includes('Профессиональная помощь в трудный момент'))
  assert.ok(changed.includes('Иллюстративное изображение') && changed.includes('Руководитель ритуальной службы'))
  assert.ok(!changed.includes('Консультирование семей и организация похорон.'))
  assert.ok(changed.indexOf('<h2>Как мы работаем') < changed.indexOf('<h2>О нашей компании'))
  assert.ok(!(await html('/sitemap.xml')).includes('<loc>' + origin + '/about</loc>'))
  assert.equal((await seedAbout(payload, true)).status, 'already-initialized')
  assert.deepEqual((await load()).sections.map(b => b.blockType), updated.map(b => b.blockType))

  for (const [index, path] of controlRoutes.entries()) assert.deepEqual(seoTags(await html(path)), before[index], path)
  const { page, service } = serviceRows.get('organizaciya-kremacii')
  await payload.update({ collection: 'pages', id: page.id, data: { _status: 'draft' } })
  assert.ok(!(await html()).includes('href="/organizaciya-kremacii"'))
  await payload.update({ collection: 'services', id: service.id, data: { _status: 'draft' } })
  assert.ok(!(await html()).includes('Консультации и помощь в организации кремации.'))
  await payload.update({ collection: 'pages', id: page.id, data: { _status: 'published' } })
  await payload.update({ collection: 'services', id: service.id, data: { _status: 'published' } })

  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 200 200] >>']
  let pdf = '%PDF-1.4\n'
  const offsets = []
  for (const [index, obj] of objects.entries()) {
    offsets.push(String(pdf.length).padStart(10, '0'))
    pdf += (index + 1) + ' 0 obj\n' + obj + '\nendobj\n'
  }
  const xref = pdf.length
  pdf += 'xref\n0 4\n0000000000 65535 f \n' + offsets.map(n => n + ' 00000 n \n').join('') +
    'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'
  const file = { name: 'test-approved.pdf', mimetype: 'application/pdf', data: Buffer.from(pdf) }
  const upload = (file, approved) => payload.create({ collection: 'public-documents', data: { title: 'Тестовый документ', approved }, file: { ...file, size: file.data.length } })
  await assert.rejects(() => upload({ ...file, name: 'invalid.txt' }, false))
  await assert.rejects(() => upload({ ...file, data: Buffer.from('invalid') }, false))
  await assert.rejects(() => upload({ ...file, data: Buffer.concat([file.data, Buffer.alloc(10 * 1024 * 1024)]) }, false))
  const doc = await upload(file, false)
  const filePath = new URL(doc.url, base).pathname
  assert.ok([401,403,404].includes((await get(filePath)).status))
  await payload.update({ collection: 'public-documents', id: doc.id, data: { approved: true } })
  updated.find(b => b.blockType === 'legal').items = [{ file: doc.id, visible: true }]
  await edit({ sections: updated, _status: 'published' })
  assert.ok((await html()).includes('Тестовый документ'))
  assert.equal((await get(filePath)).status, 200)
  await payload.update({ collection: 'public-documents', id: doc.id, data: { approved: false } })
  assert.ok(!(await html()).includes('Тестовый документ'))
  assert.ok([401,403,404].includes((await get(filePath)).status))
  await payload.updateGlobal({ slug: 'company-settings', data: { legalDetails: { ...legalSettings.legalDetails, confirmed: true } } })
  assert.ok((await html()).includes('Макаров'))
  await payload.updateGlobal({ slug: 'company-settings', data: { legalDetails: { ...legalSettings.legalDetails, confirmed: false } } })
  await edit({ _status: 'draft' })
  assert.equal((await get('/about')).status, 404)
  await edit({ sections: saved.sections, seoTitle: saved.seoTitle, robots: saved.robots, _status: 'published' })
  assert.equal((await payload.findByID({ collection: 'site-seo', id, ...publicRead })).sections?.length ?? 0, 0)
  for (const path of ['/', '/contacts','/services','/products','/prices','/info','/funeral','/pohorony-pod-klyuch','/admin/login']) {
    assert.equal((await get(path)).status, 200, path)
  }
})
