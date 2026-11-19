import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import test from 'node:test'
import pg from 'pg'

const database = new URL(process.env.CHAT_TEST_DATABASE_URL || 'about:blank')
assert.ok(['localhost','127.0.0.1'].includes(database.hostname) && database.pathname.endsWith('_chat_test'), 'Provide a dedicated local migrated *_chat_test database')

async function serve(server) {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return server.address().port
}
async function until(fn) {
  for (let i = 0; i < 150; i++) {
    if (await fn()) return
    await sleep(200)
  }
  assert.fail('Timed out waiting for chat integration')
}

test('production chat HTTP routes and persistent Telegram worker', async t => {
  const pool = new pg.Pool({ connectionString: database.href })
  assert.equal((await pool.query('SELECT count(*) FROM chat_sessions')).rows[0].count, '0', 'Use an empty migrated test database')
  t.after(async () => {
    await pool.query('DELETE FROM chat_messages')
    await pool.query('DELETE FROM chat_sessions')
    await pool.end()
  })
  let available = false
  const sent = []
  const group = '-10098765'
  const secret = 'synthetic-webhook-secret'
  const telegram = http.createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    sent.push(JSON.parse(body))
    res.writeHead(available ? 200 : 503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(available ? { ok: true, result: { chat: { id: Number(group) }, message_id: 345 } } : { ok: false }))
  })
  const fixturePort = await serve(telegram)
  t.after(() => new Promise(resolve => telegram.close(resolve)))
  const reservation = http.createServer()
  const port = await serve(reservation)
  await new Promise(resolve => reservation.close(resolve))
  const base = 'http://127.0.0.1:' + port
  const origin = 'https://integration.invalid'
  const child = spawn(process.execPath, ['--require', './tests/chat-telegram-fixture.cjs', './node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    stdio: 'ignore', windowsHide: true, env: { ...process.env, NODE_ENV: 'production', SITE_URL: origin, DATABASE_URL: database.href,
      PAYLOAD_SECRET: 'local-integration-fixture-password-only', TELEGRAM_CHAT_BOT_TOKEN: '713:test-chat-fixture', TELEGRAM_CHAT_GROUP_ID: group,
      TELEGRAM_CHAT_WEBHOOK_SECRET: secret, TELEGRAM_CHAT_OPERATOR_IDS: '50,51', CHAT_FIXTURE_URL: 'http://127.0.0.1:' + fixturePort },
  })
  t.after(async () => { if (child.exitCode === null && !child.signalCode) { const exit = once(child, 'exit'); child.kill(); await exit } })
  await until(async () => { try { return (await fetch(base + '/api/health')).ok } catch { return false } })

  const api = (path, body, cookie = '', headers = {}) => fetch(base + '/api/chat/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin, cookie, 'x-real-ip': '192.0.2.1', 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  async function create() {
    const r = await api('session', {})
    assert.equal(r.status, 201)
    const cookie = r.headers.get('set-cookie')
    assert.match(cookie, /HttpOnly/i)
    assert.match(cookie, /Secure/i)
    return cookie.split(';')[0]
  }
  const own = await create()
  const other = await create()
  const read = async (cookie, after = 0) => (await (await api('messages?after=' + after, undefined, cookie)).json()).messages
  const message = { key: randomUUID(), text: '<b>Тестовый вопрос</b>' }
  await t.test('public page renders chat, API validates body and session cookie', async () => {
    const page = await fetch(base + '/')
    assert.equal(page.status, 200)
    assert.match(await page.text(), /class="chat-launcher"/)
    assert.equal((await api('messages', { ...message, text: 'x'.repeat(2001) }, own)).status, 400)
    assert.equal((await api('messages', message, 'remember_chat=1')).status, 401)
    assert.equal((await api('messages?after=-1', undefined, own)).status, 400)
  })
  await t.test('visitor send, concurrent retry, isolation, private CMS', async () => {
    assert.equal((await api('messages')).status, 401)
    assert.equal((await api('messages', message, own, { origin: 'https://elsewhere.invalid' })).status, 403)
    const posted = await Promise.all([api('messages', message, own), api('messages', message, own)])
    assert.deepEqual(posted.map(r => r.status), [200,200])
    assert.equal((await read(own)).length, 1)
    assert.deepEqual(await read(other), [])
    for (const slug of ['chat-sessions','chat-messages']) assert.equal((await fetch(base + '/api/' + slug)).status, 403)
  })
  await t.test('outage, durable retry and group delivery', async () => {
    await until(async () => (await pool.query('SELECT attempts FROM chat_messages')).rows[0]?.attempts > 0)
    assert.equal((await read(own))[0].text, message.text)
    available = true
    await until(async () => (await pool.query('SELECT telegram_message FROM chat_messages')).rows[0]?.telegram_message === '345')
    assert.equal(sent.at(-1).chat_id, group)
    assert.match(sent.at(-1).text, /^Диалог №\d+\n\n<b>Тестовый вопрос<\/b>$/)
  })
  const reply = { chat: { id: Number(group) }, from: { id: 51 }, reply_to_message: { message_id: 345, from: { id: 713 } }, text: 'Ответ специалиста' }
  const webhook = (msg, token = secret) => api('webhook', { update_id: 78, message: msg }, '', { 'x-telegram-bot-api-secret-token': token })
  await t.test('secret, group, operator and Reply validation', async () => {
    assert.equal((await webhook(reply, 'incorrect')).status, 403)
    for (const invalid of [{...reply, chat: {id: -1}}, {...reply, from: {id: 9}}, {...reply, reply_to_message: {...reply.reply_to_message,message_id: 987}}, {...reply, reply_to_message: undefined}]) {
      assert.equal((await webhook(invalid)).status, 200)
    }
    assert.equal((await read(own)).length, 1)
  })
  await t.test('operator reply, duplicate update and incremental polling', async () => {
    const cursor = (await read(own))[0].id
    for (const r of await Promise.all([webhook(reply), webhook(reply)])) assert.equal(r.status, 200)
    const rows = await read(own, cursor)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].author, 'operator')
    assert.equal(rows[0].text, reply.text)
    assert.deepEqual(await read(other), [])
  })
  await t.test('rate limiting', async () => {
    let response
    for (let i = 0; i < 13; i++) response = await api('session', {}, own)
    assert.equal(response.status, 429)
  })
})
