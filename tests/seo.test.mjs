import assert from 'node:assert/strict'
import test from 'node:test'
import { analyze, duplicateKeywords } from '../src/seo/analyze.ts'
import { inspectContent } from '../src/seo/content.ts'
import { metadata, resolveSeo } from '../src/seo/metadata.ts'
import { canonicalOverride, keywordKey } from '../src/seo/model.ts'
import { landingPath } from '../src/seo/routes.ts'
import { serializeJsonLd, structuredData } from '../src/seo/structuredData.ts'

const origin = 'https://example.test'
const input = { origin, path: '/service', title: 'Услуга', companyName: 'Компания', indexing: true }

test('metadata uses one canonical, legacy fallbacks and a real media asset', () => {
  const fields = { seoTitle: '  SEO  ', ogImage: { url: '/file.png', width: 1200, height: 630 },
    openGraph: { title: 'Для соцсетей', image: 10 }, robots: { index: false }, focusKeyword: 'внутренний запрос' }
  const result = metadata({ ...input, fields, legacy: { seoTitle: 'Старое', seoDescription: 'Старое описание' } })
  assert.deepEqual(result.title, { absolute: 'SEO' })
  assert.equal(result.description, 'Старое описание')
  assert.equal(result.alternates.canonical, `${origin}/service`)
  assert.equal(result.openGraph.title, 'Для соцсетей')
  assert.equal(result.openGraph.images[0].url.href, `${origin}/file.png`)
  assert.equal(result.twitter.card, 'summary_large_image')
  assert.deepEqual(result.robots, { index: false, follow: true })
  assert.equal(result.keywords, undefined)
  assert.deepEqual(resolveSeo({ ...input, indexing: false }).robots, { index: false, follow: false })
})

test('normalizes queries and validates absolute canonical overrides', () => {
  assert.equal(keywordKey('  ПОХОРОНЫ\t  в Москве '), 'похороны в москве')
  assert.deepEqual(duplicateKeywords(['Ритуальные услуги', { keyword: ' ритуальные  УСЛУГИ ' }]), ['ритуальные услуги'])
  for (const value of ['/other', 'javascript:alert(1)', 'https://u:p@example.test/', 'https://example.test/#top']) {
    assert.equal(canonicalOverride(value), null)
  }
  assert.equal(canonicalOverride(' https://EXAMPLE.test/service '), `${origin}/service`)
  assert.equal(landingPath('services'), null)
})

test('analyzes visible Lexical text and leaves unknown blocks neutral', () => {
  const content = { root: { type: 'root', children: [
    { type: 'heading', tag: 'h3', children: [{ type: 'text', text: 'Заголовок' }] },
    { type: 'block', fields: { blockType: 'category-services', category: 1, text: 'запрос' } },
    { type: 'upload', value: { url: '/decor.png', alt: '', decorative: true } },
  ] } }
  assert.equal(inspectContent(content).text, 'Заголовок')
  const { checks } = analyze({ focusKeyword: 'запрос' }, { h1: 'Услуга', content, origin, staticRoute: false })
  assert.equal(checks.find(check => check.label === 'Запрос в контенте').status, 'neutral')
  assert.equal(checks.find(check => check.label === 'Заголовки H2 и H3').status, 'tip')
})

test('emits safe JSON-LD with a single organization and only present FAQ and catalog entities', () => {
  const base = { origin, path: '/service', title: '</script><script>', company: { companyName: 'Компания', serviceRegions: ['Москва'] } }
  const graph = structuredData({ ...base, type: 'OfferCatalog', services: [{ title: 'Услуга', path: '/s' }] })
  assert.equal(graph['@graph'].filter(node => node['@type'] === 'Organization').length, 1)
  assert.equal(graph['@graph'].find(node => node['@type'] === 'OfferCatalog').itemListElement[0]['@type'], 'Service')
  assert.ok(!serializeJsonLd(graph).includes('</script>'))
  assert.ok(!structuredData({ ...base, type: 'FAQPage' })['@graph'].some(node => node['@type'] === 'FAQPage'))
  assert.ok(structuredData({ ...base, type: 'FAQPage', faqs: [{ question: 'Вопрос', answer: 'Ответ' }] })['@graph']
    .some(node => node['@type'] === 'FAQPage'))
})
