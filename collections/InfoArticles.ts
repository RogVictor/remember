import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const InfoArticles: CollectionConfig = {
  slug: 'info-articles',
  labels: {
    singular: 'Материал полезной информации',
    plural: 'Материалы полезной информации',
  },
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'page', 'sortOrder', '_status'],
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
    { name: 'title', type: 'text', required: true, label: 'Заголовок карточки' },
    { name: 'summary', type: 'textarea', label: 'Краткое описание' },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      required: true,
      label: 'Страница для ссылки «Читать далее»',
      filterOptions: { _status: { equals: 'published' } },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Порядок отображения' },
  ],
}
