import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиафайлы' },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, fit: 'cover' },
      { name: 'card', width: 900, height: 700, fit: 'inside' },
    ],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'alt', type: 'text', label: 'Alt-текст', required: true },
    { name: 'caption', type: 'text', label: 'Подпись' },
  ],
}
