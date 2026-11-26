import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { FuneralOffer, FuneralSetting } from '../../payload-types'

export const offers = cache(
  async (filter: { format?: 'burial' | 'cremation'; slug?: string } = {}) => {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'funeral-offers',
      depth: 1,
      overrideAccess: false,
      pagination: false,
      sort: ['sortOrder', 'id'],
      where: filter.slug
        ? { slug: { equals: filter.slug } }
        : filter.format
          ? { format: { equals: filter.format } }
          : undefined,
      populate: {
        products: {
          title: true,
          isAvailable: true,
          price: true,
          priceMin: true,
          priceMax: true,
          priceType: true,
          _status: true,
        },
        services: {
          title: true,
          price: true,
          priceMin: true,
          priceMax: true,
          priceType: true,
          _status: true,
        },
      },
    })
    return result.docs as FuneralOffer[]
  },
)
export const publishedOffer = cache(
  async (slug: string) => (await offers({ slug }))[0],
)
export const offerIndex = cache(async () => {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'funeral-offers',
    depth: 0,
    pagination: false,
    overrideAccess: false,
    sort: ['sortOrder', 'id'],
    select: {
      slug: true,
      title: true,
      format: true,
      updatedAt: true,
      items: { reference: true, state: true },
    },
  })
  return result.docs as Pick<
    FuneralOffer,
    'id' | 'slug' | 'title' | 'format' | 'updatedAt' | 'items'
  >[]
})
export const previewOffer = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  const result = await payload.find({
    collection: 'funeral-offers',
    where: { slug: { equals: slug } },
    limit: 1,
    user,
    overrideAccess: false,
    draft: true,
    depth: 1,
  })
  return (result.docs as FuneralOffer[])[0] ?? null
})
export const settings = cache(
  async () =>
    (await getPayload({ config })).findGlobal({
      slug: 'funeral-settings',
      overrideAccess: false,
      depth: 1,
      populate: { pages: { title: true, slug: true, _status: true } },
    }) as Promise<FuneralSetting>,
)
export function contains(
  offer: Pick<FuneralOffer, 'items'>,
  collection: 'products' | 'services',
  ids: Set<number | string>,
) {
  return offer.items?.some(
    ({ reference, state }) =>
      reference &&
      state === 'included' &&
      reference.relationTo === collection &&
      ids.has(
        typeof reference.value === 'number'
          ? reference.value
          : reference.value?.id,
      ),
  )
}
export const offerPath = (o: Pick<FuneralOffer, 'slug'>) => '/funeral/' + o.slug

export async function productOfferLinks() {
  const result = new Map<number, { title: string; href: string }[]>()
  for (const offer of await offerIndex()) {
    const ids = new Set<number>()
    for (const { reference, state } of offer.items ?? []) {
      if (state === 'included' && reference?.relationTo === 'products') {
        const id =
          typeof reference.value === 'number'
            ? reference.value
            : reference.value?.id
        if (id != null) ids.add(id)
      }
    }
    for (const id of ids) {
      const entries = result.get(id) ?? []
      entries.push({ title: offer.title, href: offerPath(offer) })
      result.set(id, entries)
    }
  }
  return result
}
