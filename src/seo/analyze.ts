import { inspectContent, record } from './content'
import { canonicalOverride, keywordKey, spaces, type SeoFields } from './model'

type Status = 'pass' | 'tip' | 'problem' | 'neutral'
type Check = { label: string; status: Status; note: string }

export const characterCount = (value: string) => Array.from(value).length
export const titleRange = [50, 60] as const
export const descriptionRange = [120, 160] as const

export function analyze(fields: SeoFields, options: { h1: string; content: unknown; origin: string;
  staticRoute: boolean; assets?: ReadonlyMap<number, Record<string, unknown>> }) {
  const { h1, content, origin, staticRoute } = options
  const checks: Check[] = []
  const add = (label: string, status: Status, note: string) => checks.push({ label, status, note })
  const inspected = inspectContent(content, options.assets)
  const incomplete = staticRoute || inspected.unknown
  const phrase = (value: unknown) => spaces(keywordKey(value).replace(/[^\p{L}\p{N}]+/gu, ' '))
  const keyword = phrase(fields.focusKeyword)
  const includes = (value: unknown) => ` ${phrase(value)} `.includes(` ${keyword} `)

  for (const [label, raw, [min, max]] of [
    ['SEO Title', fields.seoTitle, titleRange],
    ['Meta Description', fields.seoDescription, descriptionRange],
  ] as const) {
    const value = raw?.trim() || ''
    const length = characterCount(value)
    add(label, !value || length < min || length > max ? 'tip' : 'pass',
      !value ? 'Используется резервное значение.' : `${length} символов, ориентир ${min}–${max}.`)
  }

  add('H1', staticRoute ? 'neutral' : !h1 ? 'problem' : inspected.headings.includes('h1') ? 'tip' : 'pass',
    staticRoute ? 'Не проверено. H1 берётся из шаблона раздела.'
      : !h1 ? 'Заполните заголовок страницы.'
      : inspected.headings.includes('h1') ? 'В тексте есть дополнительный H1.' : 'Используется заголовок страницы.')
  add('Основной запрос', keyword ? 'pass' : 'tip', keyword ? 'Заполнен.' : 'Укажите запрос для редакционной проверки.')
  for (const [label, value, partial] of [
    ['Запрос в Title', fields.seoTitle || h1, staticRoute && !fields.seoTitle],
    ['Запрос в H1', h1, staticRoute],
    ['Запрос в контенте', inspected.text, incomplete],
  ] as const) {
    const found = Boolean(keyword && includes(value))
    add(label, !keyword ? 'neutral' : found ? 'pass' : partial ? 'neutral' : 'tip',
      !keyword ? 'Не применимо без основного запроса.'
        : found ? 'Найдено точное вхождение.'
        : partial ? 'Не проверено полностью.'
        : 'Точного вхождения нет. Используйте формулировку, если она естественна в контексте.')
  }
  add('Содержательный текст', inspected.text.length >= 150 ? 'pass' : incomplete ? 'neutral' : 'tip',
    inspected.text.length >= 150 ? 'В Lexical есть основной текст.'
      : incomplete ? 'Не проверено полностью.' : 'Проверьте, достаточно ли текста для ответа на запрос.')
  const h3BeforeH2 = inspected.headings.includes('h3')
    && (!inspected.headings.includes('h2') || inspected.headings.indexOf('h3') < inspected.headings.indexOf('h2'))
  const missingH2 = !incomplete && inspected.text.length >= 150 && !inspected.headings.includes('h2')
  add('Заголовки H2 и H3', h3BeforeH2 || missingH2 ? 'tip' : incomplete ? 'neutral' : 'pass',
    h3BeforeH2 ? 'Проверьте порядок H2 и H3 в Lexical.'
      : missingH2 ? 'Разбейте длинный текст на разделы с H2, если это поможет читателю.'
      : incomplete ? 'Не проверены заголовки шаблона и динамических блоков.' : 'В Lexical нет H3 перед первым H2.')
  const internal = inspected.links.some(link => {
    if (link === 'internal') return true
    if (link.startsWith('#')) return false
    try { return new URL(link, origin).origin === origin } catch { return false }
  })
  add('Внутренние ссылки', internal ? 'pass' : incomplete ? 'neutral' : 'tip',
    internal ? 'В контенте найдена внутренняя ссылка.'
      : incomplete ? 'Не проверены ссылки шаблона и динамических блоков.' : 'Добавьте ссылку, если она поможет читателю.')
  add('ALT изображений', inspected.missingAlt ? 'tip' : inspected.unknownMedia || incomplete || !inspected.images ? 'neutral' : 'pass',
    inspected.missingAlt ? 'Есть изображения без описания ALT.'
      : inspected.unknownMedia || incomplete ? 'Не проверены все изображения.'
      : inspected.images ? 'Проверенные изображения описаны или помечены как декоративные.' : 'В Lexical нет изображений.')
  const image = fields.openGraph?.image || fields.ogImage
  add('Open Graph Image', image ? 'pass' : 'tip', image ? 'Изображение выбрано.' : 'Выберите изображение для публикаций в соцсетях.')
  const override = fields.canonicalOverride?.trim()
  add('Canonical', !override || canonicalOverride(override) ? 'pass' : 'problem',
    !override ? 'Автоматически из URL.' : canonicalOverride(override) ? 'Формат URL корректен.' : 'Некорректный абсолютный HTTP(S) URL.')
  add('Robots', fields.robots?.index === false || fields.robots?.follow === false ? 'tip' : 'pass',
    `${fields.robots?.index === false ? 'noindex' : 'index'}, ${fields.robots?.follow === false ? 'nofollow' : 'follow'}. Действует с учётом режима сайта и публикации.`)
  const type = fields.schemaType
  const contextDependent = !type || ['auto', 'FAQPage', 'OfferCatalog'].includes(type)
  add('Schema.org', contextDependent ? 'neutral' : 'pass',
    contextDependent ? 'WebPage доступен. Дополнительный тип зависит от публичного контента и связей.'
      : `Выбран тип ${type}.`)
  return { checks, mediaIds: [...inspected.unresolvedMediaIds] }
}

export function duplicateKeywords(values: unknown[]) {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const value of values) {
    const key = keywordKey(record(value)?.keyword ?? value)
    if (key && seen.has(key)) repeated.add(key)
    if (key) seen.add(key)
  }
  return [...repeated]
}

export function previewContent(content: unknown) {
  return inspectContent(content).text.split('\n').map(spaces).find(Boolean)
}
