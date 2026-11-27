import path from 'node:path'
import { APIError, type CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const PublicDocuments: CollectionConfig = {
  slug: 'public-documents',
  labels: { singular: 'Публичный документ', plural: 'Публичные документы' },
  admin: { group: 'Контент', useAsTitle: 'title' },
  upload: { staticDir: path.join(process.env.PAYLOAD_MEDIA_DIR || 'media', 'documents'), mimeTypes: ['application/pdf'], allowRestrictedFileTypes: false },
  access: {
    read: ({ req }) => req.user ? true : { approved: { equals: true } },
    create: ({ req }) => !!req.user, update: ({ req }) => !!req.user, delete: ({ req }) => isAdminUser(req.user),
  },
  hooks: { beforeOperation: [({ req, operation }) => {
    const file = req.file
    if (!file || (operation !== 'create' && operation !== 'update')) return
    if (!/\.pdf$/i.test(file.name) || file.mimetype !== 'application/pdf' || file.size > 10 * 1024 * 1024 ||
        file.data.subarray(0, 5).toString() !== '%PDF-') {
      throw new APIError('Загрузите документ PDF размером до 10 МБ.', 400)
    }
  }] },
  fields: [
    { name: 'title', label: 'Название документа', type: 'text', required: true },
    { name: 'description', label: 'Краткое описание', type: 'textarea' },
    { name: 'date', label: 'Дата документа', type: 'date' },
    { name: 'approved', label: 'Разрешён для публичного скачивания', type: 'checkbox', defaultValue: false,
      admin: { description: 'Перед публикацией проверьте документ и удалите лишние персональные данные.' } },
  ],
}
