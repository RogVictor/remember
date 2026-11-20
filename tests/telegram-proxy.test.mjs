import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { promisify } from 'node:util'
import { Agent } from 'undici'
import { requestTelegram } from '../src/lib/telegram-api.mjs'

const token = '123:fixture-bot-token'
const run = promisify(execFile)

test('uses direct delivery when the Telegram proxy variable is empty', async t => {
  const proxyURL = process.env.TELEGRAM_CHAT_PROXY_URL
  process.env.TELEGRAM_CHAT_PROXY_URL = ''
  t.after(() => {
    if (proxyURL === undefined) delete process.env.TELEGRAM_CHAT_PROXY_URL
    else process.env.TELEGRAM_CHAT_PROXY_URL = proxyURL
  })
  const payload = { chat_id: '-1001', text: 'fixture' }
  const telegram = createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ method: request.method, path: request.url, body: JSON.parse(body) }))
  })
  telegram.listen(0, '127.0.0.1')
  t.after(() => telegram.close())
  await once(telegram, 'listening')
  const dispatch = Agent.prototype.dispatch
  t.mock.method(Agent.prototype, 'dispatch', function (options, handler) {
    assert.equal(String(options.origin), 'https://api.telegram.org')
    return dispatch.call(this, { ...options, origin: `http://127.0.0.1:${telegram.address().port}` }, handler)
  })
  const response = await requestTelegram(token, 'sendMessage', payload)
  assert.deepEqual(await response.json(), { method: 'POST', path: `/bot${token}/sendMessage`, body: payload })
})

test('diagnostics use authenticated CONNECT and keep proxy errors free of secrets', async t => {
  const proxy = createServer()
  const connects = []
  proxy.on('connect', (request, socket) => {
    connects.push({ target: request.url, authorization: request.headers['proxy-authorization'] })
    socket.end('HTTP/1.1 407 Proxy Authentication Required\r\nContent-Length: 0\r\nConnection: close\r\n\r\n')
  })
  proxy.listen(0, '127.0.0.1')
  t.after(() => proxy.close())
  await once(proxy, 'listening')

  async function check(proxyURL, result) {
    await assert.rejects(run(process.execPath, ['scripts/telegram-check.mjs'], {
      env: { ...process.env, TELEGRAM_CHAT_PROXY_URL: proxyURL, TELEGRAM_CHAT_BOT_TOKEN: token },
    }), error => {
      assert.equal(error.code, 1)
      assert.equal(error.stderr, '')
      assert.deepEqual(JSON.parse(error.stdout), { mode: 'proxy', result })
      return true
    })
  }
  await check('socks5://fixture-user:fixture-password@example.invalid', 'invalid_proxy_configuration')
  await check(`http://fixture%40user:fixture%3Apassword@127.0.0.1:${proxy.address().port}`, 'connection_failed')
  assert.deepEqual(connects, [{
    target: 'api.telegram.org:443',
    authorization: 'Basic ' + Buffer.from('fixture@user:fixture:password').toString('base64'),
  }])
})
