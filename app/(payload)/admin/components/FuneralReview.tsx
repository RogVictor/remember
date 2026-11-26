'use client'
import { useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { money, groups } from '@/funeral/model'

type Entry = {
  collection: 'products' | 'services'
  id: number
  quantity: number
  included: boolean
}
type CatalogDoc = {
  id: number
  title: string
  category?: string
  _status?: string
  isAvailable?: boolean
  priceType?: string
  price?: number
  image?: { url?: string }
  images?: { url?: string }[]
}
export default function FuneralReview() {
  const fields = useFormFields(([state]) => state)
  const entries: Entry[] = []
  for (const [path, field] of Object.entries(fields)) {
    if (!/^items\.\d+\.(reference|alternative)$/.test(path) || !field.value)
      continue
    const base = path.slice(0, path.lastIndexOf('.'))
    const ref = field.value as {
      relationTo?: Entry['collection']
      value?: number
    }
    const alt = path.endsWith('alternative')
    const id = Number(alt ? field.value : ref.value)
    const collection = alt ? 'products' : ref.relationTo
    if (collection && Number.isInteger(id))
      entries.push({
        id,
        collection,
        quantity: Number(fields[base + '.quantity']?.value) || 0,
        included: !alt && fields[base + '.state']?.value === 'included',
      })
  }
  const keys = JSON.stringify(
    [...new Set(entries.map((e) => e.collection + ':' + e.id))].sort(),
  )
  const [docs, setDocs] = useState<Record<string, CatalogDoc>>({})
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    const keysList = JSON.parse(keys) as string[]
    async function load() {
      const result: Record<string, CatalogDoc> = {}
      await Promise.all(
        ['products', 'services'].map(async (collection) => {
          const ids = keysList
            .filter((k) => k.startsWith(collection + ':'))
            .map((k) => k.split(':')[1])
          if (!ids.length) return
          const query = new URLSearchParams({
            'where[id][in]': ids.join(','),
            depth: '1',
            limit: String(ids.length),
          })
          const response = await fetch('/api/' + collection + '?' + query, {
            signal: controller.signal,
          })
          if (!response.ok) throw new Error()
          const data = (await response.json()) as { docs: CatalogDoc[] }
          for (const doc of data.docs) result[collection + ':' + doc.id] = doc
        }),
      )
      if (!controller.signal.aborted) {
        setDocs(result)
        setFailed(false)
      }
    }
    load().catch(() => {
      if (!controller.signal.aborted) setFailed(true)
    })
    return () => controller.abort()
  }, [keys])
  if (!entries.length) return null
  const lines = entries.map((e) => ({
    ...e,
    doc: docs[e.collection + ':' + e.id],
  }))
  const priced = lines.filter(
    (e) =>
      e.included &&
      e.doc?._status === 'published' &&
      e.doc?.isAvailable !== false &&
      e.doc?.priceType === 'fixed' &&
      typeof e.doc.price === 'number',
  )
  const total = priced.reduce(
    (sum, e) => sum + Math.round(e.doc!.price! * 100) * e.quantity,
    0,
  )
  const count = Object.keys(fields).filter(
    (k) =>
      /^items\.\d+\.group$/.test(k) &&
      Object.hasOwn(groups, String(fields[k].value)) &&
      fields[k.replace(/group$/, 'state')]?.value === 'included',
  ).length
  const amount = Number(fields.amount?.value)
  return (
    <aside className="rg-seo">
      <h3>Проверка комплектации</h3>
      {failed && <p role="alert">Не удалось проверить каталог.</p>}
      <ul>
        {lines.map(({ doc, collection, id }, i) => (
          <li key={i}>
            {(doc?.image?.url || doc?.images?.[0]?.url) && (
              <img
                width="48"
                height="36"
                alt=""
                src={doc.image?.url || doc.images?.[0]?.url}
              />
            )}{' '}
            {doc?.title || collection + ' №' + id} · {doc?.category}{' '}
            {doc?.priceType === 'fixed' &&
              typeof doc.price === 'number' &&
              money(doc.price)}
            {(!doc ||
              doc._status !== 'published' ||
              doc.isAvailable === false) && (
              <strong> · Публичная ссылка недоступна</strong>
            )}
          </li>
        ))}
      </ul>
      <p>
        Розничная сумма включённых позиций с известной ценой ·{' '}
        {money(total / 100)} ({priced.length} из {count})
      </p>
      {priced.length === count &&
        count > 0 &&
        ['fixed', 'from'].includes(String(fields.priceType?.value)) &&
        amount > 0 && (
          <p>
            Разница с указанной ценой комплекса ·{' '}
            {money((Math.round(amount * 100) - total) / 100)}
          </p>
        )}
    </aside>
  )
}
