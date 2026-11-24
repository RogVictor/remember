import type { CollectionConfig } from 'payload'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdminUser } from './access'
import { CategoryServicesBlock } from './ServiceCategories'
import { seoTab } from '../src/seo/fields'
import { siteOrigin } from '../src/seo/config'
import { landingPath } from '../src/seo/routes'
import { keywordConflicts } from '../src/seo/keywords'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Страницы' },
  admin: { group: 'Контент', useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status', 'updatedAt'] },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  versions: { drafts: true },
  endpoints: [keywordConflicts],
  fields: [{ type: 'tabs', tabs: [{ label: 'Контент', fields: [
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
        if (!landingPath(value)) {
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
  ] }, seoTab(siteOrigin())] }],
}
