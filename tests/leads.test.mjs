import assert from 'node:assert/strict'
import test from 'node:test'
import { leadAccess } from '../collections/access.ts'
import { createLeadAndNotify, deliverLeadNotifications } from '../src/lib/lead-flow.ts'
import { LeadValidationError, normalizeLeadSubmission } from '../src/lib/lead-validation.ts'

const validSubmission = {
  name: '  Алексей   Иванов ',
  phone: '+7 (999) 123-45-67',
  email: 'client@example.com',
  service: 'Организация похорон',
  message: 'Нужна консультация',
  source: '/contacts#callback',
  requestType: 'callback',
  personalDataConsent: 'true',
}

test('normalizes a valid lead submission', () => {
  assert.deepEqual(normalizeLeadSubmission(validSubmission), {
    name: 'Алексей Иванов',
    phone: '+79991234567',
    email: 'client@example.com',
    service: 'Организация похорон',
    message: 'Нужна консультация',
    source: '/contacts#callback',
    requestType: 'callback',
    personalDataConsent: true,
  })
})

test('rejects a missing name', () => {
  assert.throws(
    () => normalizeLeadSubmission({ ...validSubmission, name: '' }),
    LeadValidationError,
  )
})

test('rejects a missing phone', () => {
  assert.throws(
    () => normalizeLeadSubmission({ ...validSubmission, phone: '' }),
    LeadValidationError,
  )
})

test('rejects an invalid email address', () => {
  assert.throws(
    () => normalizeLeadSubmission({ ...validSubmission, email: 'not-an-email' }),
    LeadValidationError,
  )
})

test('rejects a message over the configured limit', () => {
  assert.throws(
    () => normalizeLeadSubmission({ ...validSubmission, message: 'x'.repeat(2001) }),
    LeadValidationError,
  )
})

test('rejects non-object payloads and a populated honeypot', () => {
  assert.throws(() => normalizeLeadSubmission(null), LeadValidationError)
  assert.throws(
    () => normalizeLeadSubmission({ ...validSubmission, website: 'spam' }),
    LeadValidationError,
  )
})

test('keeps a saved lead when both notification providers fail', async () => {
  let saved = false
  let persistedStatuses
  const lead = await createLeadAndNotify(
    async () => {
      saved = true
      return { id: 27, ...validSubmission }
    },
    async () => { throw new Error('Telegram unavailable') },
    async () => { throw new Error('SMTP unavailable') },
    async (_id, statuses) => { persistedStatuses = statuses },
    () => assert.fail('Status persistence should succeed'),
  )

  assert.equal(saved, true)
  assert.deepEqual(persistedStatuses, {
    telegramStatus: 'failed',
    emailStatus: 'failed',
    notificationStatus: 'failed',
  })
  assert.equal(lead.id, 27)
})

test('records partial delivery and never resends an already delivered channel', async () => {
  let telegramAttempts = 0
  const statuses = await deliverLeadNotifications(
    { telegramStatus: 'sent', emailStatus: 'failed' },
    async () => { telegramAttempts += 1 },
    async () => { throw new Error('SMTP unavailable') },
  )

  assert.equal(telegramAttempts, 0)
  assert.deepEqual(statuses, {
    telegramStatus: 'sent',
    emailStatus: 'failed',
    notificationStatus: 'partial',
  })
})

test('records a Telegram outage while email succeeds', async () => {
  const statuses = await deliverLeadNotifications(
    {},
    async () => { throw new Error('Telegram unavailable') },
    async () => {},
  )

  assert.deepEqual(statuses, {
    telegramStatus: 'failed',
    emailStatus: 'sent',
    notificationStatus: 'partial',
  })
})

test('records an SMTP outage while Telegram succeeds', async () => {
  const statuses = await deliverLeadNotifications(
    {},
    async () => {},
    async () => { throw new Error('SMTP unavailable') },
  )

  assert.deepEqual(statuses, {
    telegramStatus: 'sent',
    emailStatus: 'failed',
    notificationStatus: 'partial',
  })
})

test('does not fail the submission or create another lead when saving delivery results fails', async () => {
  let createCount = 0
  let reportedLeadId
  const lead = await createLeadAndNotify(
    async () => {
      createCount += 1
      return { id: 31 }
    },
    async () => { throw new Error('Telegram unavailable') },
    async () => { throw new Error('SMTP unavailable') },
    async () => { throw new Error('Database update unavailable') },
    (id) => { reportedLeadId = id },
  )

  assert.equal(lead.id, 31)
  assert.equal(createCount, 1)
  assert.equal(reportedLeadId, 31)
})

test('public users cannot read, create, update, or delete leads', () => {
  const req = { user: null }
  assert.equal(leadAccess.read({ req }), false)
  assert.equal(leadAccess.create({ req }), false)
  assert.equal(leadAccess.update({ req }), false)
  assert.equal(leadAccess.delete({ req }), false)
})

test('staff can read leads, but only admins can update or delete them', () => {
  const staff = { user: { id: 1, role: 'editor' } }
  const admin = { user: { id: 2, role: 'admin' } }

  assert.equal(leadAccess.read({ req: staff }), true)
  assert.equal(leadAccess.update({ req: staff }), false)
  assert.equal(leadAccess.delete({ req: staff }), false)
  assert.equal(leadAccess.read({ req: admin }), true)
  assert.equal(leadAccess.update({ req: admin }), true)
  assert.equal(leadAccess.delete({ req: admin }), true)
})
