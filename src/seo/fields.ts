import type { Field, Tab } from 'payload'
import { canonicalOverride, intents, regions, schemas, spaces } from './model'
import { indexedKeyword } from './keywordKey'

const adminComponent = '/app/(payload)/admin/components/Seo'
const staffOnly = { read: ({ req }: { req: { user?: unknown } }) => Boolean(req.user) }

export const legacySeoFields: Field[] = [
  { name: 'seoTitle', type: 'text', label: 'SEO Title' },
  { name: 'seoDescription', type: 'textarea', label: 'Meta Description' },
]

function keywordList(name: 'secondaryKeywords' | 'relatedKeywords', label: string): Field {
  return {
    name, type: 'array', label, access: staffOnly,
    labels: { singular: name === 'secondaryKeywords' ? 'запрос' : 'выражение', plural: label },
    fields: [{
      name: 'keyword', type: 'text', label: 'Запрос',
      hooks: { beforeValidate: [({ value }) => spaces(value) || null] },
    }],
  }
}

export function seoTab(siteOrigin?: string): Tab {
  const section = { className: 'rg-seo-section' }
  return {
    label: 'SEO',
    fields: [
      { type: 'collapsible', label: 'Основное', admin: section, fields: [
        ...legacySeoFields,
        { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'SEO-изображение' },
        { name: 'seoPreview', type: 'ui', admin: { components: { Field: {
          path: `${adminComponent}#SeoPreview`, clientProps: { siteOrigin },
        } } } },
      ] },
      { type: 'collapsible', label: 'Семантика', admin: section, fields: [
        { name: 'focusKeyword', type: 'text', label: 'Основной запрос', access: staffOnly,
          hooks: { beforeValidate: [({ value }) => spaces(value) || null] } },
        { name: 'focusKeywordKey', type: 'text', index: true, access: staffOnly, admin: { hidden: true },
          hooks: { beforeChange: [({ siblingData, originalDoc }) =>
            indexedKeyword(Object.hasOwn(siblingData, 'focusKeyword') ? siblingData.focusKeyword : originalDoc?.focusKeyword)] } },
        keywordList('secondaryKeywords', 'Дополнительные запросы'),
        keywordList('relatedKeywords', 'Связанные выражения'),
        {
          name: 'searchIntent', type: 'select', label: 'Поисковое намерение', access: staffOnly,
          options: intents.map((value, index) => ({
            value, label: ['Коммерческое', 'Информационное', 'Транзакционное', 'Навигационное', 'Смешанное'][index],
          })),
        },
        { name: 'targetRegions', type: 'array', label: 'Целевые регионы', access: staffOnly,
          labels: { singular: 'регион', plural: 'Целевые регионы' },
          defaultValue: regions.map(region => ({ region })),
          fields: [{ name: 'region', type: 'text', label: 'Регион',
            hooks: { beforeValidate: [({ value }) => spaces(value) || null] } }] },
        { name: 'seoNotes', type: 'textarea', label: 'Внутренние заметки', access: staffOnly },
      ] },
      { type: 'collapsible', label: 'Социальные сети', admin: section, fields: [
        { name: 'openGraph', type: 'group', label: 'Open Graph', fields: [
          { name: 'title', type: 'text', label: 'Заголовок' },
          { name: 'description', type: 'textarea', label: 'Описание' },
          { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение', admin: { description: 'Рекомендуемый размер 1200 × 630 px.' } },
        ] },
      ] },
      { type: 'collapsible', label: 'Техническое SEO', admin: section, fields: [
        { name: 'canonicalOverride', type: 'text', label: 'Переопределение canonical',
          validate: (value: string | null | undefined) => !spaces(value) || canonicalOverride(value) ? true : 'Укажите абсолютный HTTP(S) URL без фрагмента и данных авторизации.' },
        { name: 'robots', type: 'group', label: 'Robots', fields: [
          { name: 'index', type: 'checkbox', defaultValue: true, label: 'Разрешить индексацию' },
          { name: 'follow', type: 'checkbox', defaultValue: true, label: 'Разрешить переход по ссылкам' },
        ] },
        { name: 'schemaType', type: 'select', label: 'Тип Schema.org', defaultValue: 'auto',
          options: schemas.map(value => ({ value, label: value === 'auto' ? 'Автоматически' : value })) },
      ] },
      { type: 'collapsible', label: 'SEO-анализ', admin: section, fields: [
        { name: 'seoAnalyzer', type: 'ui', admin: { components: { Field: {
          path: `${adminComponent}#SeoAnalyzer`, clientProps: { siteOrigin },
        } } } },
      ] },
    ],
  }
}

export function linkedSeoTab(legacy = false): Tab {
  return {
    label: 'SEO',
    fields: [
      { name: 'linkedSeo', type: 'ui', admin: { components: { Field: {
        path: `${adminComponent}#LinkedSeo`, clientProps: { legacy },
      } } } },
      ...(legacy ? [{
        type: 'collapsible' as const, label: 'Резервные SEO-поля услуги', admin: { initCollapsed: true },
        fields: legacySeoFields,
      }] : []),
    ],
  }
}
