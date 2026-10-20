import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'
import { createPriceFields } from './priceFields'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Услуга', plural: 'Услуги' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'priceType', '_status'],
  },
  access: {
    read: ({ req }) =>
      req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Название' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, label: 'URL (slug)' },
    { name: 'category', type: 'text', label: 'Категория' },
    { name: 'summary', type: 'textarea', label: 'Краткое описание' },
    { name: 'description', type: 'richText', label: 'Описание' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Изображение' },
    ...createPriceFields(),
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Порядок отображения' },
    { name: 'seoTitle', type: 'text', label: 'SEO title' },
    { name: 'seoDescription', type: 'textarea', label: 'SEO description' },
  ],
}
