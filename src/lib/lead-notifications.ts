import 'server-only'

import nodemailer from 'nodemailer'
import type { LeadNotificationStatuses } from './lead-flow'

export type LeadForNotification = {
  id: number | string
  name: string
  phone: string
  email?: string | null
  service?: string | null
  message?: string | null
  createdAt: string
  telegramStatus?: LeadNotificationStatuses['telegramStatus']
  emailStatus?: LeadNotificationStatuses['emailStatus']
}

export const toLeadForNotification = (value: Record<string, unknown>): LeadForNotification => {
  if (
    (typeof value.id !== 'number' && typeof value.id !== 'string') ||
    typeof value.name !== 'string' ||
    typeof value.phone !== 'string' ||
    typeof value.createdAt !== 'string'
  ) {
    throw new Error('Lead is missing notification fields')
  }

  return {
    id: value.id,
    name: value.name,
    phone: value.phone,
    email: typeof value.email === 'string' ? value.email : null,
    service: typeof value.service === 'string' ? value.service : null,
    message: typeof value.message === 'string' ? value.message : null,
    createdAt: value.createdAt,
    telegramStatus: value.telegramStatus === 'sent' || value.telegramStatus === 'failed'
      ? value.telegramStatus
      : 'pending',
    emailStatus: value.emailStatus === 'sent' || value.emailStatus === 'failed'
      ? value.emailStatus
      : 'pending',
  }
}

const escapeHTML = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)

const leadDetails = (lead: LeadForNotification): string => [
  `Заявка №${lead.id}`,
  `Имя: ${lead.name}`,
  `Телефон: ${lead.phone}`,
  `Услуга: ${lead.service || 'Не указана'}`,
  `Комментарий: ${lead.message || 'Нет'}`,
  `Дата: ${new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
]
  .join('\n')

const leadAdminURL = (id: string | number): string | undefined => {
  const siteURL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!siteURL) return undefined

  try {
    const baseURL = new URL(siteURL)
    if (baseURL.protocol !== 'http:' && baseURL.protocol !== 'https:') return undefined
    return new URL(`/admin/collections/leads/${encodeURIComponent(id)}`, baseURL).toString()
  } catch {
    return undefined
  }
}

export const sendTelegramLeadNotification = async (lead: LeadForNotification): Promise<void> => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) throw new Error('Telegram is not configured')

  const details = leadDetails(lead)
  const adminURL = leadAdminURL(lead.id)
  const message = `<b>${escapeHTML(details.split('\n')[0])}</b>\n${details
    .split('\n')
    .slice(1)
    .map(escapeHTML)
    .join('\n')}${adminURL ? `\n<a href="${escapeHTML(adminURL)}">Открыть заявку в админке</a>` : ''}`
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('Telegram notification failed')
}

export const sendEmailLeadNotification = async (lead: LeadForNotification): Promise<void> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, LEADS_EMAIL_TO } = process.env
  const port = Number(SMTP_PORT)
  if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 ||
    !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !LEADS_EMAIL_TO) {
    throw new Error('Email is not configured')
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  })
  const details = leadDetails(lead)
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: LEADS_EMAIL_TO,
    subject: `Новая заявка №${lead.id}`,
    text: details,
  })
}
