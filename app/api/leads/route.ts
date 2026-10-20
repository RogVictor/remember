import { NextResponse } from 'next/server'
import { isIP } from 'node:net'
import config from '@payload-config'
import { getPayload } from 'payload'
import { createLeadAndNotify } from '@/lib/lead-flow'
import {
  sendEmailLeadNotification,
  sendTelegramLeadNotification,
  toLeadForNotification,
} from '@/lib/lead-notifications'
import { LeadValidationError, normalizeLeadSubmission } from '@/lib/lead-validation'
import { checkLeadRateLimit } from '@/lib/lead-rate-limit'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 8192

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status })

class RequestBodyTooLargeError extends Error {}

const readJsonBody = async (request: Request): Promise<unknown> => {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new RequestBodyTooLargeError()
  }

  if (!request.body) throw new LeadValidationError('Request body is required')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new RequestBodyTooLargeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new LeadValidationError('Invalid JSON')
  }
}

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return errorResponse('Не удалось обработать заявку.', 415)
  }

  const origin = request.headers.get('origin')
  const configuredSiteURL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  try {
    if (
      process.env.NODE_ENV === 'production' &&
      (!configuredSiteURL || new URL(configuredSiteURL).protocol !== 'https:')
    ) {
      console.error('[Leads] Request rejected because the canonical HTTPS site URL is not configured.')
      return errorResponse('Форма временно недоступна.', 503)
    }
    const siteURL = configuredSiteURL || request.url
    if (
      (process.env.NODE_ENV === 'production' && !origin) ||
      (origin && new URL(origin).origin !== new URL(siteURL).origin)
    ) {
      return errorResponse('Не удалось обработать заявку.', 403)
    }
  } catch {
    return errorResponse('Не удалось обработать заявку.', 403)
  }

  const clientIP = request.headers.get('x-real-ip')?.trim()
  if (process.env.NODE_ENV === 'production' && (!clientIP || isIP(clientIP) === 0)) {
    console.error('[Leads] Request rejected because the trusted proxy did not provide a valid client IP.')
    return errorResponse('Форма временно недоступна.', 503)
  }
  if (clientIP && isIP(clientIP) !== 0) {
    const rateLimit = checkLeadRateLimit(clientIP)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Слишком много заявок. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      )
    }
  }

  let submission
  try {
    submission = normalizeLeadSubmission(await readJsonBody(request))
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return errorResponse('Размер заявки превышает допустимый предел.', 413)
    }
    return errorResponse(
      error instanceof LeadValidationError
        ? 'Проверьте имя, телефон, email и согласие на обработку данных.'
        : 'Не удалось обработать заявку.',
      400,
    )
  }

  try {
    const payload = await getPayload({ config })
    const lead = await createLeadAndNotify(
      () => payload.create({
        collection: 'leads',
        data: {
          ...submission,
          telegramStatus: 'pending',
          emailStatus: 'pending',
          notificationStatus: 'pending',
        },
        overrideAccess: true,
      }).then((lead) => toLeadForNotification(lead)),
      sendTelegramLeadNotification,
      sendEmailLeadNotification,
      (id, statuses) => payload.update({
        collection: 'leads',
        id,
        data: statuses,
        overrideAccess: true,
      }).then(() => undefined),
      (id) => console.error(`[Leads] Could not store notification results for lead ${id}.`),
    )
    return NextResponse.json({ success: true, id: lead.id }, { status: 201 })
  } catch {
    console.error('[Leads] Could not save a new lead.')
    return errorResponse('Не удалось сохранить заявку. Попробуйте отправить её ещё раз.', 500)
  }
}
