import type { Page, Service, ServiceCategory } from '../../payload-types'

type SeoImportFields = Pick<Page, 'seoTitle' | 'seoDescription' | 'focusKeyword' | 'searchIntent' |
  'seoNotes' | 'canonicalOverride' | 'robots' | 'schemaType'> & {
    ogImage?: number | null
    openGraph?: { title?: string | null; description?: string | null; image?: number | null } | null
    secondaryKeywords?: { keyword: string }[]
    relatedKeywords?: { keyword: string }[]
    targetRegions?: { region: string }[]
  }

type LandingPage = Pick<Page, 'title' | 'slug' | 'content' | '_status'> & SeoImportFields

export type LandingImport =
  | { kind: 'category'; category: Pick<ServiceCategory, 'title' | 'active'>; page: LandingPage }
  | { kind: 'service'; service: Pick<Service, 'title' | 'slug' | 'summary' | 'priceType' | 'serviceCategory' | '_status'> &
    { serviceCategory: number }; page: LandingPage }
