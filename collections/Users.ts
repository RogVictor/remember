import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: { useAsTitle: 'email', defaultColumns: ['email', 'name', 'role'] },
  auth: true,
  hooks: {
    beforeValidate: [async ({ data, req }) => {
      if (!req.user) {
        const result = await req.payload.count({ collection: 'users', overrideAccess: true })
        if (result.totalDocs === 0) return { ...data, role: 'admin' }
      }
      return data
    }],
  },
  access: {
    // Bootstrap is allowed only while the collection is empty. Afterwards only admins can add users.
    create: async ({ req }) => {
      if (req.user) return isAdminUser(req.user)
      const result = await req.payload.count({ collection: 'users', overrideAccess: true })
      return result.totalDocs === 0
    },
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => isAdminUser(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'name', type: 'text', label: 'Имя' },
    {
      name: 'role', type: 'select', label: 'Роль', required: true, defaultValue: 'editor',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор', value: 'editor' },
      ],
      access: {
        update: ({ req }) => isAdminUser(req.user),
      },
    },
  ],
}
