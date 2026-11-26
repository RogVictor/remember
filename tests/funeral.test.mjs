import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import test from 'node:test'
import { getPayload } from 'payload'
import { displayPrice } from '../src/funeral/model.ts'

test('funeral catalogue, publication, backlinks and estimate delivery', async (t) => {
  const db = new URL(process.env.FUNERAL_TEST_DATABASE_URL)
  assert.ok(
    ['127.0.0.1', 'localhost'].includes(db.hostname) &&
      db.pathname.endsWith('_funeral_test'),
  )
  const origin = 'https://integration.invalid'
  Object.assign(process.env, {
    DATABASE_URL: db.href,
    SITE_URL: origin,
    NODE_ENV: 'production',
    PAYLOAD_SECRET: 'local-only-funeral-integration-fixture',
    SEO_INDEXING_ENABLED: 'true',
  })
  const { default: config } = await import('../payload.config.ts')
  const payload = await getPayload({ config })
  t.after(() => payload.destroy())
  const find = () =>
    payload.find({
      collection: 'funeral-offers',
      overrideAccess: false,
      pagination: false,
    })
  const drafts = await payload.find({
    collection: 'funeral-offers',
    draft: true,
    limit: 0,
  })
  assert.equal(drafts.totalDocs, 6, 'Start with a fresh migrated test database')
  assert.equal((await find()).totalDocs, 0)
  const password = randomUUID()
  const user = await payload.create({
    collection: 'users',
    data: {
      email: 'review@example.test',
      password,
      role: 'admin',
    },
  })
  const create = (collection, data) =>
    payload.create({ collection, data, user, overrideAccess: false })
  const edit = (collection, id, data) =>
    payload.update({ collection, id, data, user, overrideAccess: false })
  const product = await create('products', {
    slug: 'fixture-product',
    title: 'Товар для проверки',
    priceType: 'fixed',
    price: 22.5,
    _status: 'published',
  })
  const page = await create('pages', {
    slug: 'fixture-service',
    title: 'Услуга для проверки',
    _status: 'published',
  })
  const service = await create('services', {
    slug: page.slug,
    title: page.title,
    page: page.id,
    _status: 'published',
  })
  const draft = drafts.docs.find((d) => d.slug === 'ekonom')
  let items = [
    {
      group: 'coffin',
      reference: { relationTo: 'products', value: product.id },
      state: 'included',
      quantity: 2,
      short: true,
      showPrice: true,
    },
    {
      group: 'agent',
      reference: { relationTo: 'services', value: service.id },
      state: 'included',
      quantity: 1,
    },
  ]
  const data = {
    title: 'Проверка комплекта',
    slug: 'fixture',
    category: draft.category.id,
    priceType: 'fixed',
    amount: 128.54,
    format: 'burial',
    summary: 'Только для локальной проверки.',
    items,
    _status: 'published',
  }
  await assert.rejects(() =>
    payload.create({
      collection: 'funeral-offers',
      overrideAccess: false,
      data,
    }),
  )
  await assert.rejects(() => create('funeral-offers', { ...data, amount: -1 }))
  await assert.rejects(() =>
    create('funeral-offers', { ...data, amount: 1.234 }),
  )
  await assert.rejects(() =>
    create('funeral-offers', { ...data, amount: null }),
  )
  const offer = await create('funeral-offers', data)
  items = [items[1], { ...items[0], quantity: 3 }]
  const updated = await edit('funeral-offers', offer.id, {
    items,
    title: 'Проверка состава',
    priceType: 'from',
  })
  assert.equal(updated.items[0].reference.value.id, service.id)
  assert.equal(displayPrice(offer), '128,54 ₽')
  assert.equal(displayPrice(updated), 'от 128,54 ₽')
  assert.equal(
    displayPrice({ ...offer, priceType: 'individual' }),
    'Индивидуальный расчёт',
  )
  assert.equal(
    displayPrice({ ...offer, priceType: 'request' }),
    'Цена по запросу',
  )
  assert.equal(displayPrice({ ...offer, amount: null }), 'Цена по запросу')
  const cremation = await create('funeral-offers', {
    ...data,
    slug: 'fixture-cremation',
    format: 'cremation',
    title: 'Проверка кремации',
    priceType: 'individual',
  })
  const messages = []
  let successful = true
  const telegram = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    messages.push(JSON.parse(body))
    res
      .writeHead(successful ? 200 : 503, { 'content-type': 'application/json' })
      .end(JSON.stringify({ ok: successful }))
  })
  telegram.listen(0, '127.0.0.1')
  await once(telegram, 'listening')
  t.after(() => new Promise((resolve) => telegram.close(resolve)))
  const socket = createServer()
  socket.listen(0, '127.0.0.1')
  await once(socket, 'listening')
  const port = socket.address().port
  await new Promise((resolve) => socket.close(resolve))
  const base = 'http://127.0.0.1:' + port
  const child = spawn(
    process.execPath,
    [
      '--require',
      './tests/chat-telegram-fixture.cjs',
      './node_modules/next/dist/bin/next',
      'start',
      '-H',
      '127.0.0.1',
      '-p',
      String(port),
    ],
    {
      stdio: 'ignore',
      windowsHide: true,
      env: {
        ...process.env,
        TELEGRAM_CHAT_BOT_TOKEN: '713:test-chat-fixture',
        TELEGRAM_CHAT_GROUP_ID: '-10098765',
        TELEGRAM_CHAT_WEBHOOK_SECRET: '',
        TELEGRAM_CHAT_PROXY_URL: '',
        CHAT_FIXTURE_URL: 'http://127.0.0.1:' + telegram.address().port,
        SMTP_HOST: '',
      },
    },
  )
  t.after(async () => {
    if (child.exitCode === null && !child.signalCode) {
      const exit = once(child, 'exit')
      child.kill()
      await exit
    }
  })
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + '/api/health')).ok) break
    } catch {}
    await sleep(200)
  }
  async function html(path) {
    const res = await fetch(base + path)
    assert.equal(res.status, 200, path)
    return (await res.text()).split('<script>self.__next_f')[0]
  }
  assert.match(await html('/funeral'), /Сравнение комплексов/)
  const formatPage = await html('/funeral?format=cremation')
  assert.ok(
    formatPage.includes(cremation.title) && !formatPage.includes(updated.title),
  )
  const detail = await html('/funeral/fixture')
  assert.ok(
    detail.includes('product-' + product.id) &&
      detail.includes('/fixture-service') &&
      detail.includes('application/ld+json'),
  )
  assert.ok((await html('/products')).includes('/funeral/fixture'))
  assert.ok((await html('/fixture-service')).includes('/funeral/fixture'))
  assert.ok((await html('/sitemap.xml')).includes('/funeral/fixture'))
  assert.equal((await fetch(base + '/funeral/ekonom')).status, 404)
  assert.equal((await fetch(base + '/funeral/ekonom?preview=1')).status, 404)
  const login = await fetch(base + '/api/users/login', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.email, password }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers
    .getSetCookie()
    .find((c) => c.startsWith('payload-token='))
    .split(';')[0]
  const preview = await fetch(base + '/funeral/ekonom?preview=1', {
    headers: { cookie, 'sec-fetch-site':'same-origin' },
  })
  assert.equal(preview.status, 200)
  assert.match(await preview.text(), /Предварительный просмотр/)
  await edit('products', product.id, { title: 'Обновлённая карточка' })
  assert.ok((await html('/funeral/fixture')).includes('Обновлённая карточка'))
  await edit('products', product.id, { _status: 'draft' })
  assert.ok(
    !(await html('/funeral/fixture')).includes(
      '/products#product-' + product.id,
    ),
  )
  const submit = (displayedPrice) =>
    fetch(base + '/api/leads', {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        'x-real-ip': '192.0.2.5',
      },
      body: JSON.stringify({
        name: 'Тест',
        phone: '70000000000',
        personalDataConsent: true,
        message: 'Тестовый комментарий',
        offerId: offer.id,
        displayedPrice,
        source: '/funeral/fixture',
      }),
    })
  assert.equal((await submit('Устаревшая цена')).status, 409)
  const res = await submit(displayPrice(updated))
  assert.equal(res.status, 201)
  const { id } = await res.json()
  assert.ok(
    messages[0].text.includes(updated.title) &&
      messages[0].text.includes('Тестовый комментарий'),
  )
  assert.equal(messages[0].chat_id, '-10098765')
  await edit('funeral-offers', offer.id, { amount: 140 })
  const lead = await payload.findByID({ collection: 'leads', id })
  assert.ok(lead.offerSnapshot.includes(displayPrice(updated)))
  assert.equal(lead.telegramStatus, 'sent')
  successful = false
  const failed = await submit(displayPrice({ ...updated, amount: 140 }))
  assert.equal(failed.status, 201)
  assert.equal(
    (
      await payload.findByID({
        collection: 'leads',
        id: (await failed.json()).id,
      })
    ).telegramStatus,
    'failed',
  )
  await edit('funeral-offers', offer.id, { archived: true })
  assert.equal((await fetch(base + '/funeral/fixture')).status, 404)
  assert.ok(!(await html('/products')).includes('href="/funeral/fixture"'))
  assert.ok(!(await html('/sitemap.xml')).includes('/funeral/fixture</loc>'))
  await edit('funeral-offers', cremation.id, { _status: 'draft' })
  assert.equal((await fetch(base + '/funeral/fixture-cremation')).status, 404)
})
