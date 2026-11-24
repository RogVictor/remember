import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'
import { seoTab } from '../src/seo/fields'
import { siteOrigin } from '../src/seo/config'
import { staticRoutes } from '../src/seo/routes'

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
  fields: [{ type: 'tabs', tabs: [{
    label: 'Раздел',
    fields: [{
      name: 'route', type: 'select', label: 'Публичный раздел', required: true, unique: true,
      options: Object.entries(staticRoutes).map(([value, label]) => ({ value, label: `${label} (${value})` })),
    }],
  }, seoTab(siteOrigin())] }],
}
