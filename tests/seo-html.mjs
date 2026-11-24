import assert from 'node:assert/strict'

const base = new URL(process.env.SEO_TEST_APP_URL || 'http://127.0.0.1:52484')
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname), 'Use a local server with the SEO fixture.')
const get = async path => {
  const response = await fetch(new URL(path, base), { headers: { 'User-Agent': 'Googlebot' }, redirect: 'manual' })
  return { status: response.status, html: await response.text() }
}
const assertTag = (html, name, content) => {
  const tags = [...html.matchAll(/<meta (?:name|property)="([^"]+)" content="([^"]*)"\/?\s*>/g)]
  assert.deepEqual(tags.filter(match => match[1] === name).map(match => match[2]), [content])
}
const graph = html => {
  const graphs = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)]
  assert.equal(graphs.length, 1)
  return JSON.parse(graphs[0][1])['@graph']
}
const phase = process.argv[2]
const sitemap = (await get('/sitemap.xml')).html
const service = await get('/seo-service')
if (phase === 'unpublished') {
  assert.equal(service.status, 404)
  assert.ok(!sitemap.includes('/seo-service'))
  assert.ok(!(await get('/seo-category')).html.includes('href="/seo-service"'))
  console.log('Unpublished landing returns 404 and leaves sitemap and category links.')
} else if (phase === 'staging') {
  assertTag(service.html, 'robots', 'noindex, nofollow')
  assert.match((await get('/robots.txt')).html, /Disallow: \/\s/)
  assert.ok(!sitemap.includes('<loc>'))
  console.log('Runtime staging policy blocks indexing and returns an empty sitemap.')
} else {
  assert.equal(service.status, 200)
  assert.equal([...service.html.matchAll(/<link rel="canonical" href="https:\/\/example\.test\/seo-service"/g)].length, 1)
  const title = service.html.match(/<title>([^<]+)<\/title>/)?.[1]
  if (phase === 'republished') {
    assert.equal(title, 'Неопубликованный SEO Title')
  } else {
    assert.match(title, /^Резервный Title услуги \| /)
    assert.ok(!service.html.includes('Неопубликованный SEO Title'))
  }
  assertTag(service.html, 'description', 'Проверочное описание услуги из Lexical.')
  assertTag(service.html, 'robots', 'index, follow')
  assertTag(service.html, 'og:title', 'Заголовок соцсетей')
  assertTag(service.html, 'twitter:card', 'summary_large_image')
  assert.ok(!service.html.includes('Внутренняя запись'))
  assert.ok(!service.html.includes('name="keywords"'))
  assert.ok(graph(service.html).some(node => node['@type'] === 'Service'))
  assert.ok(graph(service.html).some(node => node['@type'] === 'BreadcrumbList'))
  assert.match(service.html, /href="\/seo-category"/)
  const category = await get('/seo-category')
  assert.match(category.html, /href="\/seo-service"/)
  assert.ok(graph(category.html).some(node => node['@type'] === 'OfferCatalog'))
  const legacy = await get('/seo-legacy')
  assert.match(legacy.html, /<title>Старый Title<\/title>/)
  assertTag(legacy.html, 'description', 'Старый Description')
  assertTag(legacy.html, 'og:image', 'https://example.test/api/media/file/seo-legacy.png')
  const about = await get('/about')
  assert.match(about.html, /<title>Проверочное SEO раздела<\/title>/)
  assertTag(about.html, 'robots', 'noindex, follow')
  assertTag((await get('/seo-inactive')).html, 'robots', 'noindex, nofollow')
  assert.equal((await get('/seo-draft')).status, 404)
  assert.match(sitemap, /<loc>https:\/\/example\.test\/seo-service<\/loc>\s*<lastmod>/)
  for (const path of ['/about', '/seo-duplicate', '/seo-draft', '/seo-inactive', '/admin']) {
    assert.ok(!sitemap.includes(`${path}</loc>`), path)
  }
  const faq = await get('/faq')
  assert.match(faq.html, /Проверочный ответ\./)
  assert.ok(graph(faq.html).some(node => node['@type'] === 'FAQPage'))
  assert.match((await get('/robots.txt')).html, /Sitemap: https:\/\/example\.test\/sitemap\.xml/)
  console.log('Production HTML, structured data, canonical, robots, sitemap, drafts and catalog links verified.')
}
