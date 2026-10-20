export type CMSPrice = {
  price: number | null
  priceMax: number | null
  priceMin: number | null
  priceType: 'fixed' | 'range' | 'on-request'
}

export type CMSMedia = {
  alt: string
  url: string
}

export type CMSService = CMSPrice & {
  category: string | null
  description: string | null
  id: number | string
  image: CMSMedia | null
  linkSlug: string | null
  sortOrder: number
  summary: string | null
  title: string
}

export type CMSProduct = CMSPrice & {
  category: string | null
  description: string | null
  id: number | string
  images: CMSMedia[]
  isAvailable: boolean
  sortOrder: number
  summary: string | null
  title: string
}

export type CMSPriceItem = CMSPrice & {
  category: string | null
  description: string | null
  id: number | string
  linkSlug: string | null
  sortOrder: number
  title: string
  unit: string | null
}

export type CMSFAQ = {
  answer: string
  id: number | string
  question: string
  sortOrder: number
}

export type CMSPage = {
  content: SerializedEditorState | null
  id: number | string
  seoDescription: string | null
  seoTitle: string | null
  slug: string
  title: string
}

export type CMSResult<T> = {
  data: T[]
  error: boolean
}
import type { SerializedEditorState } from 'lexical'
