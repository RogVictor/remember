import type { Metadata } from 'next'
import { canonicalURL, spaces, type SeoFields } from './model'

export type SeoInput = {
  title: string
  description?: string | null
  path: string
  origin: string
  companyName?: string
  fields?: SeoFields | null
  legacy?: Pick<SeoFields, 'seoTitle' | 'seoDescription'>
  indexing: boolean
}

export function resolveSeo({ title, description, path, origin, fields, legacy, indexing, companyName }: SeoInput) {
  const fallbackTitle = spaces(legacy?.seoTitle) || spaces(title)
  const pageTitle = fields?.seoTitle?.trim() || (companyName ? `${fallbackTitle} | ${companyName}` : fallbackTitle)
  const pageDescription = fields?.seoDescription?.trim() || legacy?.seoDescription?.trim() || description?.trim() || undefined
  const canonical = canonicalURL(origin, path, fields?.canonicalOverride)
  const image = [fields?.openGraph?.image, fields?.ogImage].flatMap(value => {
    if (!value || typeof value !== 'object' || !value.url) return []
    try {
      const url = new URL(value.url, origin)
      if (!['https:', 'http:'].includes(url.protocol)) return []
      return [{ url, alt: value.alt ?? undefined, width: value.width ?? undefined, height: value.height ?? undefined }]
    } catch {
      return []
    }
  })[0]
  return {
    title: pageTitle,
    description: pageDescription,
    canonical,
    image,
    socialTitle: fields?.openGraph?.title?.trim() || pageTitle,
    socialDescription: fields?.openGraph?.description?.trim() || pageDescription,
    robots: { index: indexing && fields?.robots?.index !== false, follow: indexing && fields?.robots?.follow !== false },
  }
}

export function metadata(input: SeoInput, article = false): Metadata {
  const seo = resolveSeo(input)
  const social = { title: seo.socialTitle, description: seo.socialDescription, images: seo.image && [seo.image] }
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: seo.robots,
    openGraph: { ...social, type: article ? 'article' : 'website', locale: 'ru_RU', siteName: input.companyName, url: seo.canonical },
    twitter: { ...social, card: seo.image ? 'summary_large_image' : 'summary' },
  }
}
