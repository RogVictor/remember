export const regions = ['Москва', 'Московская область'] as const
export const intents = ['commercial', 'informational', 'transactional', 'navigational', 'mixed'] as const
export const schemas = ['auto', 'WebPage', 'Service', 'OfferCatalog', 'Article', 'FAQPage'] as const

export type SeoMedia = { url?: string | null; alt?: string | null; width?: number | null; height?: number | null }
export type SeoFields = {
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: number | SeoMedia | null
  focusKeyword?: string | null
  secondaryKeywords?: { keyword?: string | null }[] | null
  relatedKeywords?: { keyword?: string | null }[] | null
  searchIntent?: typeof intents[number] | null
  targetRegions?: { region?: string | null }[] | null
  seoNotes?: string | null
  openGraph?: { title?: string | null; description?: string | null; image?: number | SeoMedia | null } | null
  canonicalOverride?: string | null
  robots?: { index?: boolean | null; follow?: boolean | null } | null
  schemaType?: typeof schemas[number] | null
}

export function spaces(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : ''
}

export const keywordKey = (value: unknown) => spaces(value).toLocaleLowerCase('ru')

export function canonicalOverride(value: unknown): string | null {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim()) || /[\s\\#]/u.test(value.trim())) return null
  try {
    const parsed = new URL(value.trim())
    return parsed.username || parsed.password ? null : parsed.href
  } catch {
    return null
  }
}

export function canonicalURL(origin: string, path: string, override?: string | null) {
  return canonicalOverride(override) ?? new URL(path, origin).href
}
