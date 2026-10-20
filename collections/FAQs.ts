import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Вопрос и ответ', plural: 'Частые вопросы' },
  admin: { useAsTitle: 'question', defaultColumns: ['question', '_status'] },
  access: {
    read: ({ req }) =>
      req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  versions: { drafts: true },
  fields: [
    { name: 'question', type: 'text', required: true, label: 'Вопрос' },
    { name: 'answer', type: 'textarea', required: true, label: 'Ответ' },
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Порядок отображения' },
  ],
}
