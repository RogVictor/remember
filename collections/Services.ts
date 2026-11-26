import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'
import { createPriceFields } from './priceFields'
import { linkedSeoTab } from '../src/seo/fields'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Услуга', plural: 'Услуги' },
  admin: {
    group: 'Каталог',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'image', 'priceType', 'price', '_status'],
  },
  access: {
    read: ({ req }) =>
      req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  versions: { drafts: true },
  fields: [{ type: 'tabs', tabs: [{ label: 'Услуга', fields: [
    { name: 'title', type: 'text', required: true, label: 'Название' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, label: 'URL (slug)' },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      label: 'Страница услуги',
      filterOptions: ({ data }) => data?._status === 'draft' || { _status: { equals: 'published' } },
      admin: {
        allowCreate: true,
        allowEdit: true,
        description: 'В черновике можно связать страницу до публикации.',
      },
    },
    {
      name: 'linkSlug',
      type: 'text',
      label: 'Ссылка на страницу (slug)',
      admin: {
        condition: (data) => !data.page,
        description: 'Если страница услуги не выбрана, можно указать адрес существующего раздела, например funeral.',
      },
      validate: (value: string | null | undefined) =>
        value == null || value.trim() === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())
          ? true
          : 'Используйте строчные латинские буквы, цифры и дефисы.',
    },
    { name: 'category', type: 'text', label: 'Категория' },
    {
      name: 'serviceCategory',
      type: 'relationship',
      relationTo: 'service-categories',
      label: 'Категория из справочника',
      filterOptions: ({ data }) => data?._status === 'draft' || { active: { equals: true } },
      admin: { description: 'Если не выбрана, каталог подберёт категорию по названию из текстового поля.' },
    },
    { name: 'summary', type: 'textarea', label: 'Краткое описание' },
    { name: 'description', type: 'richText', label: 'Описание' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение' },
    ...createPriceFields(),
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Порядок отображения' },
  ] }, linkedSeoTab(true)] }],
}
