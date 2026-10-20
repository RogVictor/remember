import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: { useAsTitle: 'phone', defaultColumns: ['phone', 'name', 'status', 'createdAt'], group: 'Обращения' },
  timestamps: true,
  access: {
    // Публичное создание будет разрешено только через отдельный валидирующий API endpoint.
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'name', type: 'text', label: 'Имя' },
    { name: 'phone', type: 'text', required: true, label: 'Телефон' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'requestType', type: 'select', label: 'Тип обращения', options: [
      { label: 'Обратный звонок', value: 'callback' },
      { label: 'Услуги', value: 'service' },
      { label: 'Товары', value: 'product' },
      { label: 'Вопрос по цене', value: 'price' },
      { label: 'Другое', value: 'other' },
    ] },
    { name: 'message', type: 'textarea', label: 'Сообщение' },
    { name: 'personalDataConsent', type: 'checkbox', required: true, label: 'Согласие на обработку персональных данных' },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', label: 'Статус', options: [
      { label: 'Новая', value: 'new' }, { label: 'В работе', value: 'in-progress' },
      { label: 'Завершена', value: 'done' }, { label: 'Спам', value: 'spam' },
    ] },
    { name: 'source', type: 'text', label: 'Источник' },
    { name: 'telegramStatus', type: 'select', defaultValue: 'pending', label: 'Уведомление Telegram', options: [
      { label: 'Ожидает', value: 'pending' }, { label: 'Отправлено', value: 'sent' }, { label: 'Ошибка', value: 'failed' },
    ] },
    { name: 'emailStatus', type: 'select', defaultValue: 'pending', label: 'Email-уведомление', options: [
      { label: 'Ожидает', value: 'pending' }, { label: 'Отправлено', value: 'sent' }, { label: 'Ошибка', value: 'failed' },
    ] },
  ],
}
