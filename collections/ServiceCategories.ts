import type { Block, CollectionConfig } from 'payload'
import { isAdminUser } from './access'
import { linkedSeoTab } from '../src/seo/fields'

export const ServiceCategories: CollectionConfig = {
  slug: 'service-categories',
  labels: { singular: 'Категория услуг', plural: 'Категории услуг' },
  admin: { group: 'Каталог', useAsTitle: 'title', defaultColumns: ['title', 'active', 'page'] },
  access: {
    read: ({ req }) => req.user ? true : { active: { equals: true } },
    create: ({ req }) => isAdminUser(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  fields: [{ type: 'tabs', tabs: [{ label: 'Категория', fields: [
    { name: 'title', type: 'text', required: true, unique: true, label: 'Название' },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Активна' },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      label: 'Страница категории',
      filterOptions: { _status: { equals: 'published' } },
      admin: { allowCreate: true, allowEdit: true },
    },
    {
      name: 'linkSlug',
      type: 'text',
      label: 'Ссылка на страницу (slug)',
      admin: { description: 'Резервный адрес существующей страницы или раздела, например funeral.' },
      validate: (value: string | null | undefined) =>
        value == null || value.trim() === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())
          ? true
          : 'Используйте строчные латинские буквы, цифры и дефисы.',
    },
  ] }, linkedSeoTab()] }],
}

export const CategoryServicesBlock: Block = {
  slug: 'category-services',
  interfaceName: 'CategoryServicesBlock',
  labels: { singular: 'Услуги категории', plural: 'Услуги категории' },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'service-categories',
      required: true,
      label: 'Категория услуг',
      filterOptions: { active: { equals: true } },
    },
  ],
}
