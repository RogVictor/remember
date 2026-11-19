import type { Access, CollectionConfig, Field } from 'payload'
import { isAdminUser } from './access'

const admin: Access = ({ req }) => isAdminUser(req.user)
const access = { read: admin, update: admin, create: () => false, delete: () => false }
const internal = { readOnly: true } as const
const secret: Field = { name: 'tokenHash', type: 'text', required: true, unique: true, hidden: true }

export const ChatSessions: CollectionConfig = {
  slug: 'chat-sessions',
  labels: { singular: 'Диалог', plural: 'Диалоги' },
  access,
  admin: { defaultColumns: ['id', 'status', 'updatedAt'] },
  fields: [
    secret,
    { name: 'status', type: 'select', options: ['new', 'active', 'closed'], defaultValue: 'new', required: true },
    { name: 'name', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'messages', type: 'join', collection: 'chat-messages', on: 'session' },
  ],
}

export const ChatMessages: CollectionConfig = {
  slug: 'chat-messages',
  labels: { singular: 'Сообщение чата', plural: 'Сообщения чата' },
  access: { ...access, update: () => false },
  admin: { defaultColumns: ['session', 'author', 'text', 'createdAt'] },
  indexes: [
    { fields: ['session', 'clientKey'], unique: true },
    { fields: ['telegramGroup', 'telegramMessage'], unique: true },
  ],
  fields: [
    { name: 'session', type: 'relationship', relationTo: 'chat-sessions', required: true, admin: internal },
    { name: 'author', type: 'select', options: ['visitor', 'operator'], required: true },
    { name: 'text', type: 'textarea', required: true },
    { name: 'clientKey', type: 'text' },
    { name: 'telegramGroup', type: 'text' },
    { name: 'telegramMessage', type: 'number' },
    { name: 'telegramUpdate', type: 'number', unique: true },
    { name: 'retryAt', type: 'date', index: true },
    { name: 'attempts', type: 'number', defaultValue: 0 },
  ],
}
