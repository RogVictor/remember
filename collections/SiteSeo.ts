import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'
import { seoTab } from '../src/seo/fields'
import { aboutSections } from './aboutSections'
import { siteOrigin } from '../src/seo/config'
import { staticRoutes } from '../src/seo/routes'
import { guidePath, situations, situationTitles } from '../src/guide/data'

export const SiteSeo: CollectionConfig = {
  slug: 'site-seo',
  labels: { singular: 'SEO раздела', plural: 'SEO разделов' },
  admin: { group: 'Контент', useAsTitle: 'route', defaultColumns: ['route', '_status', 'updatedAt'] },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  versions: { drafts: true },
  fields: [aboutSections, { type: 'tabs', tabs: [{
    label: 'Раздел',
    fields: [{
      name: 'route', type: 'select', label: 'Публичный раздел', required: true, unique: true,
      options: Object.entries(staticRoutes).map(([value, label]) => ({ value, label: `${label} (${value})` })),
    }],
  }, {
    label: 'Памятка',
    admin: { condition: data => data.route === guidePath },
    fields: situations.map(key => ({
      name: key, label: situationTitles[key], type: 'array' as const,
      admin: { description: 'Пустой список использует базовую инструкцию.' },
      fields: [
        { name: 'summary', label: 'Краткий шаг', type: 'text', required: true },
        { name: 'detail', label: 'Подробное пояснение', type: 'textarea', required: true },
      ],
    })),
  }, seoTab(siteOrigin())] }],
}
