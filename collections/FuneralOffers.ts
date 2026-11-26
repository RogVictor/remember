import type { CollectionConfig, Field, GlobalConfig, Tab } from 'payload'
import { isAdminUser } from './access'
import {
  formats,
  groups,
  states,
  sections,
  priceTypes,
  funeralTitle,
  funeralIntro,
  funeralSteps,
} from '../src/funeral/model'

const text = (name: string, label: string, required = false): Field => ({
  name,
  type: 'text',
  label,
  required,
})
const area = (name: string, label: string): Field => ({
  name,
  label,
  type: 'textarea',
})
const opts = (items: Record<string, string>) =>
  Object.entries(items).map(([value, label]) => ({ value, label }))
const select = (
  name: string,
  label: string,
  items: Record<string, string>,
  defaultValue?: string,
): Field => ({
  name,
  label,
  type: 'select',
  options: opts(items),
  required: true,
  defaultValue,
})
const image = (name: string, label: string, hasMany = false): Field => {
  const field = {
    name,
    label,
    type: 'upload',
    relationTo: 'media',
    filterOptions: { mimeType: { like: 'image/' } },
  } as const
  return hasMany ? { ...field, hasMany: true } : field
}
const faq: Field = {
  name: 'faq',
  label: 'Частые вопросы',
  type: 'array',
  fields: [text('question', 'Вопрос', true), area('answer', 'Ответ')],
}
const sort: Field = {
  name: 'sortOrder',
  type: 'number',
  defaultValue: 0,
  label: 'Порядок',
}
const edit: CollectionConfig['access'] = {
  create: ({ req }) => Boolean(req.user),
  update: ({ req }) => Boolean(req.user),
  delete: ({ req }) => isAdminUser(req.user),
}
export const FuneralCategories: CollectionConfig = {
  slug: 'funeral-categories',
  labels: { singular: 'Категория комплекса', plural: 'Категории комплексов' },
  admin: { group: 'Комплексы похорон', useAsTitle: 'title' },
  access: { ...edit, read: () => true, delete: () => false },
  fields: [
    {
      name: 'title',
      label: 'Категория',
      type: 'text',
      unique: true,
      required: true,
    },
    sort,
  ],
}
const tabs: Tab[] = [
  {
    label: 'Основное',
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Название',
        required: true,
        maxLength: 160,
      },
      {
        name: 'slug',
        type: 'text',
        required: true,
        unique: true,
        maxLength: 90,
        validate: (v: unknown) =>
          (typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) ||
          'Введите адрес латиницей с дефисами.',
      },
      {
        name: 'category',
        type: 'relationship',
        relationTo: 'funeral-categories',
        required: true,
        label: 'Категория',
      },
      select('format', 'Формат', formats),
      {
        name: 'summary',
        type: 'textarea',
        required: true,
        label: 'Краткое описание',
      },
      area('description', 'Полное описание'),
      area('benefits', 'Преимущества'),
      text('accent', 'Текстовый акцент'),
      sort,
    ],
  },
  {
    label: 'Стоимость и условия',
    fields: [
      select('priceType', 'Отображение цены', priceTypes, 'request'),
      {
        name: 'amount',
        type: 'number',
        label: 'Стоимость в рублях',
        min: 0.01,
        max: 999999999,
        admin: {
          step: 0.01,
          condition: (_, s) => ['fixed', 'from'].includes(s.priceType),
        },
        validate: (
          value: unknown,
          { siblingData }: { siblingData: unknown },
        ) => {
          if (
            !['fixed', 'from'].includes(
              (siblingData as { priceType: string }).priceType,
            )
          )
            return true
          return (
            (typeof value === 'number' &&
              value > 0 &&
              value <= 999999999 &&
              /^\d+(\.\d{1,2})?$/.test(String(value))) ||
            'Укажите сумму больше нуля с точностью до копеек.'
          )
        },
      },
      { name: 'priceDate', type: 'date', label: 'Дата актуализации цены' },
      area('included', 'Что входит'),
      area('excluded', 'Что не входит'),
      area('expenses', 'Дополнительные расходы'),
      area('terms', 'Условия и изменение комплектации'),
      area('region', 'Региональные условия'),
    ],
  },
  {
    label: 'Фотографии',
    fields: [image('cover', 'Обложка'), image('gallery', 'Галерея', true)],
  },
  {
    label: 'Комплектация',
    fields: [
      {
        name: 'items',
        label: 'Позиции в порядке показа',
        type: 'array',
        fields: [
          select('group', 'Категория сравнения', groups),
          select('state', 'Состояние', states, 'included'),
          {
            name: 'reference',
            label: 'Товар или услуга',
            type: 'relationship',
            relationTo: ['products', 'services'],
            admin: { appearance: 'drawer' },
          },
          {
            name: 'label',
            type: 'text',
            label: 'Уточнение или название текстовой позиции',
            validate: (v: unknown, { siblingData }: { siblingData: unknown }) =>
              Boolean(
                (siblingData as { reference?: unknown }).reference ||
                (typeof v === 'string' && v.trim()),
              ) || 'Выберите позицию или укажите название.',
          },
          {
            name: 'quantity',
            type: 'number',
            required: true,
            defaultValue: 1,
            min: 1,
            max: 100000,
            label: 'Количество',
            validate: (v: unknown) =>
              Number.isSafeInteger(v) || 'Укажите целое количество.',
          },
          text('unit', 'Единица'),
          area('comment', 'Комментарий'),
          area('limits', 'Ограничения'),
          {
            name: 'alternative',
            type: 'relationship',
            relationTo: 'products',
            label: 'Альтернативный товар',
          },
          { name: 'short', type: 'checkbox', label: 'Показывать в карточке' },
          {
            name: 'showPrice',
            type: 'checkbox',
            label: 'Показывать цену позиции',
          },
        ],
      },
    ],
  },
  {
    label: 'FAQ и SEO',
    fields: [
      faq,
      text('seoTitle', 'SEO Title'),
      area('seoDescription', 'SEO Description'),
      text('ogTitle', 'Open Graph Title'),
      area('ogDescription', 'Open Graph Description'),
      image('ogImage', 'Open Graph Image'),
    ],
  },
  {
    label: 'Публикация',
    fields: [
      {
        name: 'archived',
        type: 'checkbox',
        label: 'Архивировать и скрыть',
        defaultValue: false,
      },
    ],
  },
]
export const FuneralOffers: CollectionConfig = {
  slug: 'funeral-offers',
  labels: { singular: 'Комплекс похорон', plural: 'Комплексы похорон' },
  versions: { drafts: true },
  admin: {
    group: 'Комплексы похорон',
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'category',
      'format',
      'priceType',
      'sortOrder',
      '_status',
    ],
    preview: (doc) => (doc.slug ? '/funeral/' + doc.slug + '?preview=1' : null),
  },
  defaultSort: 'sortOrder',
  access: {
    ...edit,
    delete: () => false,
    read: ({ req }) =>
      req.user
        ? true
        : { _status: { equals: 'published' }, archived: { not_equals: true } },
  },
  fields: [
    { type: 'tabs', tabs },
    {
      name: 'catalogReview',
      type: 'ui',
      admin: {
        components: { Field: '/app/(payload)/admin/components/FuneralReview' },
      },
    },
  ],
}
export const FuneralSettings: GlobalConfig = {
  slug: 'funeral-settings',
  label: 'Страница организации похорон',
  admin: { group: 'Комплексы похорон' },
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: funeralTitle,
      label: 'Заголовок',
    },
    {
      name: 'intro',
      type: 'textarea',
      defaultValue: funeralIntro,
      label: 'Введение',
    },
    image('hero', 'Изображение первого экрана'),
    area('benefits', 'Преимущества (по одному на строку)'),
    text('chooseLabel', 'Кнопка выбора комплекса'),
    text('consultLabel', 'Кнопка консультации'),
    {
      name: 'steps',
      type: 'array',
      label: 'Этапы',
      defaultValue: funeralSteps.map((title) => ({ title })),
      fields: [
        text('title', 'Название', true),
        area('description', 'Описание'),
      ],
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Порядок и заголовки разделов',
      defaultValue: Object.keys(sections).map((key) => ({
        key,
        visible: true,
      })),
      fields: [
        select('key', 'Раздел', sections),
        text('heading', 'Свой заголовок'),
        {
          name: 'visible',
          type: 'checkbox',
          defaultValue: true,
          label: 'Показывать',
        },
      ],
      validate: (rows: unknown) =>
        !Array.isArray(rows) ||
        new Set(rows.map((row) => row.key)).size === rows.length ||
        'Каждый раздел можно добавить один раз.',
    },
    area('documents', 'Документы'),
    area('geography', 'География'),
    area('advantages', 'Преимущества компании'),
    ...[
      ['directions', 'Основные направления'],
      ['extras', 'Дополнительные услуги'],
      ['programs', 'Специальные программы'],
      ['articles', 'Полезная информация'],
    ].map(([name, label]): Field => ({
      name,
      label,
      type: 'relationship',
      relationTo: 'pages',
      hasMany: true,
    })),
    faq,
  ],
}
