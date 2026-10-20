import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'
import { createPriceFields } from './priceFields'

export const PriceItems: CollectionConfig = {
  slug: 'price-items',
  labels: { singular: 'Позиция прайса', plural: 'Прайс-лист' },
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
    { name: 'title', type: 'text', required: true, label: 'Название позиции' },
    { name: 'category', type: 'text', label: 'Категория' },
    { name: 'description', type: 'textarea', label: 'Пояснение' },
    { name: 'unit', type: 'text', label: 'Единица измерения' },
    ...createPriceFields(),
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Порядок отображения' },
  ],
}
