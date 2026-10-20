export type LeadSubmission = {
  name: string
  phone: string
  email?: string
  service?: string
  message?: string
  source: string
  requestType: 'callback' | 'service' | 'product' | 'price' | 'other'
  personalDataConsent: true
}

export class LeadValidationError extends Error {}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requiredText = (value: unknown, field: string, maxLength: number): string => {
  if (typeof value !== 'string') throw new LeadValidationError(`Invalid ${field}`)
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized || normalized.length > maxLength) {
    throw new LeadValidationError(`Invalid ${field}`)
  }
  return normalized
}

const optionalText = (value: unknown, field: string, maxLength: number): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new LeadValidationError(`Invalid ${field}`)
  const normalized = value.trim()
  if (normalized.length > maxLength) throw new LeadValidationError(`Invalid ${field}`)
  return normalized || undefined
}

export const normalizeLeadSubmission = (value: unknown): LeadSubmission => {
  if (!record(value)) throw new LeadValidationError('Invalid request')
  if (typeof value.website !== 'undefined' && value.website !== '') {
    throw new LeadValidationError('Invalid request')
  }
  if (value.personalDataConsent !== true && value.personalDataConsent !== 'true') {
    throw new LeadValidationError('Consent is required')
  }

  const phoneInput = requiredText(value.phone, 'phone', 40)
  if (!/^\+?[\d\s().-]+$/.test(phoneInput)) throw new LeadValidationError('Invalid phone')
  const phoneDigits = phoneInput.replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15) throw new LeadValidationError('Invalid phone')

  const email = optionalText(value.email, 'email', 254)?.toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new LeadValidationError('Invalid email')
  }

  const requestType = value.requestType ?? 'other'
  if (!['callback', 'service', 'product', 'price', 'other'].includes(String(requestType))) {
    throw new LeadValidationError('Invalid request type')
  }

  const source = optionalText(value.source, 'source', 200) ?? '/unknown'
  if (!source.startsWith('/') || source.startsWith('//') || /[\r\n]/.test(source)) {
    throw new LeadValidationError('Invalid source')
  }

  return {
    name: requiredText(value.name, 'name', 120),
    phone: `${phoneInput.startsWith('+') ? '+' : ''}${phoneDigits}`,
    email,
    service: optionalText(value.service, 'service', 160),
    message: optionalText(value.message, 'message', 2000),
    source,
    requestType: requestType as LeadSubmission['requestType'],
    personalDataConsent: true,
  }
}
