import 'server-only'

import { cache } from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'
import { unstable_noStore as noStore } from 'next/cache'
import { DEFAULT_COMPANY_SETTINGS } from './cms-types'
import { mediaURL } from './media-url'
import { groupServices } from './service-categories'
import { landingPath, isStaticRoute, type StaticRoute } from '../seo/routes'
import type { CompanySetting, Page, SiteSeo } from '../../payload-types'
import type {
  CMSFAQ,
  CMSCompanySettings,
  CMSInfoArticle,
  CMSMedia,
  CMSPrice,
  CMSPriceItem,
  CMSProduct,
  CMSResult,
  CMSService,
  CMSServiceCategory,
} from './cms-types'

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

export const relationshipID = (value: unknown): string | number | null => {
  const id = isRecord(value) ? value.id : value
  return typeof id === 'string' || typeof id === 'number' ? id : null
}

const publishedPageSlug = (value: unknown) =>
  isRecord(value) && value._status === 'published' ? text(value.slug) : null

const optionalText = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value.trim() : fallback

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
  const src = mediaURL(url, value.updatedAt)
  const card = isRecord(value.sizes) && isRecord(value.sizes.card) ? value.sizes.card : null
  const srcSet = card && typeof card.url === 'string' && typeof card.width === 'number' &&
    typeof value.width === 'number' && card.width < value.width
    ? `${mediaURL(card.url, value.updatedAt)} ${card.width}w, ${src} ${value.width}w`
    : undefined
  return { url, src, srcSet, alt: value.decorative === true ? '' : text(value.alt) ?? '' }
}

const documents = async (collection: 'services' | 'products' | 'price-items' | 'faqs') => {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection,
    depth: 1,
    draft: false,
    ...(collection === 'services'
      ? { limit: 0, populate: { pages: { slug: true, title: true, _status: true } } }
      : { limit: 200 }),
    overrideAccess: false,
    sort: 'sortOrder',
    where: { _status: { equals: 'published' } },
  })

  return result.docs
}

export const getPublishedPage = cache(async (slug: string): Promise<Page | null> => {
  if (!landingPath(slug)) return null
  noStore()
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'pages',
      depth: 1,
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
    return (result.docs[0] as Page | undefined) ?? null
  } catch (error) {
    console.error(`[CMS] Could not load published page with slug "${slug}" from Payload.`, error)
    throw new Error(`Could not load published page "${slug}".`, { cause: error })
  }
})

export const getPublicSeoEntries = async () => {
  noStore()
  const payload = await getPayload({ config })
  const options = { depth: 0, draft: false, pagination: false, limit: 0, overrideAccess: false,
    where: { _status: { equals: 'published' } } } as const
  const [pages, sections] = await Promise.all([
    payload.find({ ...options, collection: 'pages',
      select: { slug: true, updatedAt: true, canonicalOverride: true, robots: true } }),
    payload.find({ ...options, collection: 'site-seo',
      select: { route: true, updatedAt: true, canonicalOverride: true, robots: true } }),
  ])
  return {
    pages: pages.docs as Pick<Page, 'id' | 'slug' | 'updatedAt' | 'canonicalOverride' | 'robots'>[],
    sections: sections.docs as Pick<SiteSeo, 'route' | 'updatedAt' | 'canonicalOverride' | 'robots'>[],
  }
}

export const getStaticSeo = cache(async (route: StaticRoute): Promise<SiteSeo | null> => {
  noStore()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'site-seo', depth: 1, draft: false, limit: 1,
    overrideAccess: false, where: { route: { equals: route }, _status: { equals: 'published' } } })
  return (docs[0] as SiteSeo | undefined) ?? null
})

// Inactive directory entries are hidden by public access. Read only the
// association and its state to keep those landings out of search.
export const getInactiveLandingIds = cache(async () => {
  noStore()
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'service-categories', depth: 0, pagination: false,
    overrideAccess: true, select: { page: true, active: true }, where: { page: { exists: true } } })
  const inactive = new Set<string | number>()
  const active = new Set<string | number>()
  for (const doc of docs) {
    const id = relationshipID(doc.page)
    if (id !== null) (doc.active ? active : inactive).add(id)
  }
  for (const id of active) inactive.delete(id)
  return inactive
})

export const getPublishedInfoArticles = cache(async (): Promise<CMSInfoArticle[]> => {
  noStore()
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'info-articles',
      depth: 1,
      draft: false,
      limit: 200,
      overrideAccess: false,
      sort: 'sortOrder',
      where: { _status: { equals: 'published' } },
    })

    return result.docs.flatMap((doc) => {
      if (!isRecord(doc.page) || doc.page._status !== 'published') return []

      const pageSlug = text(doc.page.slug)
      const title = text(doc.title)
      if (!pageSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageSlug) || !title) return []

      return [{ description: text(doc.summary), pageSlug, title }]
    })
  } catch (error) {
    console.error('[CMS] Could not load published info articles from Payload.', error)
    throw new Error('Could not load published info articles.', { cause: error })
  }
})

const reportLoadFailure = (collection: string): void => {
  console.error(`[CMS] Could not load published ${collection} from Payload.`)
}

export const getCompanySettings = cache(async (): Promise<CMSCompanySettings> => {
  noStore()
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'company-settings',
      depth: 1,
      overrideAccess: false,
    }) as CompanySetting
    const values: RecordValue = isRecord(settings) ? settings : {}

    return {
      additionalPhone: optionalText(values.additionalPhone, DEFAULT_COMPANY_SETTINGS.additionalPhone),
      address: optionalText(values.address, DEFAULT_COMPANY_SETTINGS.address),
      brandSlogan: optionalText(values.brandSlogan, DEFAULT_COMPANY_SETTINGS.brandSlogan),
      city: text(values.city) ?? DEFAULT_COMPANY_SETTINGS.city,
      companyName: text(values.companyName) ?? DEFAULT_COMPANY_SETTINGS.companyName,
      email: optionalText(values.email, DEFAULT_COMPANY_SETTINGS.email),
      heroImage: media(values.heroImage),
      logo: media(values.logo),
      messengerUrl: optionalText(values.messengerUrl, DEFAULT_COMPANY_SETTINGS.messengerUrl),
      phone: text(values.phone) ?? DEFAULT_COMPANY_SETTINGS.phone,
      schemaOrganizationType: settings.schemaOrganizationType === 'FuneralHome' ? 'FuneralHome' : 'Organization',
      serviceRegions: (settings.serviceRegions ?? []).flatMap(({ region }) => text(region) ?? []),
      workingHours: text(values.workingHours) ?? DEFAULT_COMPANY_SETTINGS.workingHours,
    }
  } catch (error) {
    console.error('[CMS] Could not load company settings from Payload.', error)
    throw new Error('Could not load company settings.', { cause: error })
  }
})

export const getServices = cache(async (): Promise<CMSResult<CMSService>> => {
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
          fallbackSlug: doc.page == null ? text(doc.slug) : null,
          pageTitle: isRecord(doc.page) ? text(doc.page.title) : null,
          summary: text(doc.summary),
          seoTitle: text(doc.seoTitle),
          seoDescription: text(doc.seoDescription),
          description: richText(doc.description),
          image: media(doc.image),
          linkSlug: doc.page == null ? text(doc.linkSlug) : publishedPageSlug(doc.page),
          serviceCategoryId: relationshipID(doc.serviceCategory),
          sortOrder: sortOrder(doc.sortOrder),
          ...price(doc),
        }]
      }),
    }
  } catch {
    reportLoadFailure('services')
    return { data: [], error: true }
  }
})

async function getServiceCategories(): Promise<CMSServiceCategory[]> {
  noStore()
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'service-categories',
      depth: 2,
      draft: false,
      limit: 0,
      overrideAccess: false,
      populate: { pages: { slug: true, _status: true, ogImage: true } },
      where: { active: { equals: true } },
    })
    return docs.flatMap(doc => {
      const id = relationshipID(doc.id)
      const title = text(doc.title)
      return id == null || !title ? [] : [{
        id,
        title,
        image: isRecord(doc.page) && publishedPageSlug(doc.page) ? media(doc.page.ogImage) : null,
        pageSlug: publishedPageSlug(doc.page),
        linkSlug: text(doc.linkSlug),
      }]
    })
  } catch {
    reportLoadFailure('service-categories')
    return []
  }
}

const isStaticServiceTarget = (slug: string) => isStaticRoute(`/${slug}`)

async function getCatalogLinks(services: CMSService[], categories: CMSServiceCategory[]) {
  const candidates = [...new Set([
    ...services.flatMap(({ linkSlug, fallbackSlug }) => [linkSlug, fallbackSlug]),
    ...categories.flatMap(({ pageSlug, linkSlug }) => [pageSlug, linkSlug]),
  ].filter((slug): slug is string =>
    Boolean(landingPath(slug)),
  ))]
  const publishedSlugs = new Set<string>()

  if (candidates.length > 0) {
    try {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'pages',
        depth: 0,
        draft: false,
        limit: 0,
        overrideAccess: false,
        select: { slug: true },
        where: { slug: { in: candidates }, _status: { equals: 'published' } },
      })
      for (const doc of docs) {
        const slug = text(doc.slug)
        if (slug) publishedSlugs.add(slug)
      }
    } catch (error) {
      console.error('[CMS] Could not verify service page links.', error)
    }
  }

  const isExistingRoute = (slug: string) => isStaticServiceTarget(slug) || publishedSlugs.has(slug)
  const serviceLinks = new Map<CMSService['id'], string>()
  for (const { id, linkSlug, fallbackSlug } of services) {
    if (linkSlug && isExistingRoute(linkSlug)) {
      serviceLinks.set(id, `/${linkSlug}`)
    } else if (fallbackSlug && publishedSlugs.has(fallbackSlug)) {
      serviceLinks.set(id, `/${fallbackSlug}`)
    }
  }
  const categoryLinks = new Map<CMSServiceCategory['id'], string>()
  for (const { id, pageSlug, linkSlug } of categories) {
    if (pageSlug && publishedSlugs.has(pageSlug)) categoryLinks.set(id, `/${pageSlug}`)
    else if (linkSlug && isExistingRoute(linkSlug)) categoryLinks.set(id, `/${linkSlug}`)
  }
  return { serviceLinks, categoryLinks }
}

export const getServiceCatalog = cache(async () => {
  const [services, categories] = await Promise.all([getServices(), getServiceCategories()])
  const groups = groupServices(services.data, categories)
  const links = await getCatalogLinks(services.data, categories)
  return { services, groups, ...links }
})

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
