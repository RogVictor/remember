import type { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdminUser } from './access'
import { CategoryServicesBlock } from './ServiceCategories'

const reservedSlugs = new Set([
  'about',
  'contacts',
  'faq',
  'funeral',
  'info',
  'legal',
  'prices',
  'products',
  'services',
  'admin',
  'api',
])

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Страницы' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status', 'updatedAt'] },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заголовок' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'URL (slug)',
      validate: (value: string | null | undefined) => {
        if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          return 'Используйте строчные латинские буквы, цифры и дефисы.'
        }
        if (reservedSlugs.has(value)) {
          return 'Этот адрес уже занят существующим разделом сайта.'
        }
        return true
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Содержимое',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [
            CategoryServicesBlock,
            {
              slug: 'callback-form',
              interfaceName: 'CallbackFormBlock',
              labels: { singular: 'Заказать звонок', plural: 'Формы обратной связи' },
              fields: [],
            },
          ] }),
        ],
      }),
    },
    { name: 'seoTitle', type: 'text', label: 'SEO title' },
    { name: 'seoDescription', type: 'textarea', label: 'SEO description' },
    { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Open Graph изображение' },
  ],
}
