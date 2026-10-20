import type { CollectionConfig } from 'payload'
import { deliverLeadNotifications } from '../src/lib/lead-flow'
import {
  sendEmailLeadNotification,
  sendTelegramLeadNotification,
  toLeadForNotification,
} from '../src/lib/lead-notifications'
import { isAdminUser, leadAccess } from './access'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['createdAt', 'name', 'phone', 'service', 'status'],
    group: 'Обращения',
  },
  defaultSort: '-createdAt',
  timestamps: true,
  access: leadAccess,
  endpoints: [
    {
      path: '/:id/retry-notifications',
      method: 'post',
      handler: async (req) => {
        if (!isAdminUser(req.user)) {
          return Response.json({ message: 'Forbidden' }, { status: 403 })
        }

        const id = req.routeParams?.id
        if (typeof id !== 'string' || !id) {
          return Response.json({ message: 'Invalid lead ID' }, { status: 400 })
        }

        try {
          const storedLead = await req.payload.findByID({
            collection: 'leads',
            id,
            overrideAccess: true,
          })
          const lead = toLeadForNotification(storedLead)
          const statuses = await deliverLeadNotifications(
            lead,
            () => sendTelegramLeadNotification(lead),
            () => sendEmailLeadNotification(lead),
          )
          await req.payload.update({
            collection: 'leads',
            id,
            data: statuses,
            overrideAccess: true,
          })
          return Response.json({ success: true, ...statuses })
        } catch {
          console.error(`[Leads] Notification retry failed for lead ${id}.`)
          return Response.json({ message: 'Could not retry notifications.' }, { status: 500 })
        }
      },
    },
  ],
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120, label: 'Имя' },
    { name: 'phone', type: 'text', required: true, maxLength: 40, label: 'Телефон' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'service', type: 'text', maxLength: 160, label: 'Услуга' },
    { name: 'requestType', type: 'select', label: 'Тип обращения', options: [
      { label: 'Обратный звонок', value: 'callback' },
      { label: 'Услуги', value: 'service' },
      { label: 'Товары', value: 'product' },
      { label: 'Вопрос по цене', value: 'price' },
      { label: 'Другое', value: 'other' },
    ] },
    { name: 'message', type: 'textarea', maxLength: 2000, label: 'Сообщение' },
    { name: 'personalDataConsent', type: 'checkbox', required: true, label: 'Согласие на обработку персональных данных' },
    { name: 'status', type: 'select', required: true, defaultValue: 'new', label: 'Статус', options: [
      { label: 'Новая', value: 'new' }, { label: 'В работе', value: 'in-progress' },
      { label: 'Завершена', value: 'completed' }, { label: 'Отменена', value: 'cancelled' },
    ] },
    { name: 'source', type: 'text', maxLength: 200, label: 'Источник' },
    { name: 'notificationStatus', type: 'select', defaultValue: 'pending', label: 'Статус уведомлений', options: [
      { label: 'Ожидает', value: 'pending' }, { label: 'Все отправлены', value: 'sent' },
      { label: 'Частично отправлены', value: 'partial' }, { label: 'Ошибка', value: 'failed' },
    ] },
    { name: 'telegramStatus', type: 'select', defaultValue: 'pending', label: 'Уведомление Telegram', options: [
      { label: 'Ожидает', value: 'pending' }, { label: 'Отправлено', value: 'sent' }, { label: 'Ошибка', value: 'failed' },
    ] },
    { name: 'emailStatus', type: 'select', defaultValue: 'pending', label: 'Email-уведомление', options: [
      { label: 'Ожидает', value: 'pending' }, { label: 'Отправлено', value: 'sent' }, { label: 'Ошибка', value: 'failed' },
    ] },
  ],
}
