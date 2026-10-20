import 'server-only'

import { cache } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'
import { unstable_noStore as noStore } from 'next/cache'
import type {
  CMSFAQ,
  CMSMedia,
  CMSPage,
  CMSPrice,
  CMSPriceItem,
  CMSProduct,
  CMSResult,
  CMSService,
} from './cms-types'

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

const number = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const sortOrder = (value: unknown): number => number(value) ?? 0

const price = (record: RecordValue): CMSPrice => {
  const priceType =
    record.priceType === 'fixed' || record.priceType === 'range'
      ? record.priceType
      : 'on-request'

  return {
    priceType,
    price: number(record.price),
    priceMin: number(record.priceMin),
    priceMax: number(record.priceMax),
  }
}

const richText = (value: unknown): string | null => {
  const parts: string[] = []

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!isRecord(node)) return

    if (typeof node.text === 'string') {
      parts.push(node.text)
      return
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visit)
      parts.push('\n')
    } else if (isRecord(node.root)) {
      visit(node.root)
    }
  }

  visit(value)
  return text(parts.join('').replace(/\n{2,}/g, '\n'))
}

const media = (value: unknown): CMSMedia | null => {
  if (!isRecord(value)) return null
  const url = text(value.url)
  if (!url) return null
  return { url, alt: text(value.alt) ?? '' }
}

const documents = async (collection: 'services' | 'products' | 'price-items' | 'faqs') => {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection,
    depth: 1,
    draft: false,
    limit: 200,
    overrideAccess: false,
    sort: 'sortOrder',
    where: { _status: { equals: 'published' } },
  })

  return result.docs
}

export const getPublishedPage = cache(async (slug: string): Promise<CMSPage | null> => {
  noStore()
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      draft: false,
      limit: 1,
      overrideAccess: false,
      where: {
        and: [
          { slug: { equals: slug } },
          { _status: { equals: 'published' } },
        ],
      },
    })
    const doc = result.docs[0]
    if (!doc) return null

    return {
      content: doc.content,
      id: typeof doc.id === 'number' || typeof doc.id === 'string' ? doc.id : doc.title,
      seoDescription: text(doc.seoDescription),
      seoTitle: text(doc.seoTitle),
      slug: doc.slug,
      title: doc.title,
    }
  } catch (error) {
    console.error(`[CMS] Could not load published page with slug "${slug}" from Payload.`, error)
    throw new Error(`Could not load published page "${slug}".`, { cause: error })
  }
})

export const getPublishedPageSlugs = async (): Promise<string[]> => {
  noStore()
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      select: { slug: true },
      where: { _status: { equals: 'published' } },
    })
    return result.docs.flatMap(({ slug }) => {
      const value = text(slug)
      return value ? [value] : []
    })
  } catch (error) {
    console.error('[CMS] Could not load published page slugs from Payload.', error)
    throw new Error('Could not load published page slugs.', { cause: error })
  }
}

const reportLoadFailure = (collection: string): void => {
  console.error(`[CMS] Could not load published ${collection} from Payload.`)
}

export const getServices = async (): Promise<CMSResult<CMSService>> => {
  noStore()
  try {
    const docs = await documents('services')
    return {
      error: false,
      data: docs.flatMap((doc) => {
        if (!isRecord(doc)) return []
        const title = text(doc.title)
        if (!title) return []
        return [{
          id: typeof doc.id === 'number' || typeof doc.id === 'string' ? doc.id : title,
          title,
          category: text(doc.category),
          summary: text(doc.summary),
          description: richText(doc.description),
          image: media(doc.image),
          linkSlug: text(doc.linkSlug),
          sortOrder: sortOrder(doc.sortOrder),
          ...price(doc),
        }]
      }),
    }
  } catch {
    reportLoadFailure('services')
    return { data: [], error: true }
  }
}

export const getProducts = async (): Promise<CMSResult<CMSProduct>> => {
  noStore()
  try {
    const docs = await documents('products')
    return {
      error: false,
      data: docs.flatMap((doc) => {
        if (!isRecord(doc)) return []
        const title = text(doc.title)
        if (!title) return []
        const isAvailable =
          typeof doc.isAvailable === 'boolean'
            ? doc.isAvailable
            : typeof doc.available === 'boolean'
              ? doc.available
              : true
        if (!isAvailable) return []

        const imagesValue = Array.isArray(doc.images) && doc.images.length > 0
          ? doc.images
          : Array.isArray(doc.gallery)
            ? doc.gallery
            : []

        return [{
          id: typeof doc.id === 'number' || typeof doc.id === 'string' ? doc.id : title,
          title,
          category: text(doc.category),
          summary: text(doc.summary),
          description: richText(doc.description),
          images: imagesValue.flatMap((image) => {
            const populatedImage = media(image)
            return populatedImage ? [populatedImage] : []
          }),
          isAvailable,
          sortOrder: sortOrder(doc.sortOrder),
          ...price(doc),
        }]
      }),
    }
  } catch {
    reportLoadFailure('products')
    return { data: [], error: true }
  }
}

export const getPriceItems = async (): Promise<CMSResult<CMSPriceItem>> => {
  noStore()
  try {
    const docs = await documents('price-items')
    return {
      error: false,
      data: docs.flatMap((doc) => {
        if (!isRecord(doc)) return []
        const title = text(doc.title)
        if (!title) return []
        return [{
          id: typeof doc.id === 'number' || typeof doc.id === 'string' ? doc.id : title,
          title,
          category: text(doc.category),
          description: text(doc.description),
          linkSlug: text(doc.linkSlug),
          unit: text(doc.unit),
          sortOrder: sortOrder(doc.sortOrder),
          ...price(doc),
        }]
      }),
    }
  } catch {
    reportLoadFailure('price items')
    return { data: [], error: true }
  }
}

export const getFAQs = async (): Promise<CMSResult<CMSFAQ>> => {
  noStore()
  try {
    const docs = await documents('faqs')
    return {
      error: false,
      data: docs.flatMap((doc) => {
        if (!isRecord(doc)) return []
        const question = text(doc.question)
        const answer = text(doc.answer)
        if (!question || !answer) return []
        return [{
          id: typeof doc.id === 'number' || typeof doc.id === 'string' ? doc.id : question,
          question,
          answer,
          sortOrder: sortOrder(doc.sortOrder),
        }]
      }),
    }
  } catch {
    reportLoadFailure('FAQs')
    return { data: [], error: true }
  }
}
