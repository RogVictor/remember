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

export type CMSCompanySettings = {
  additionalPhone: string
  address: string
  brandSlogan: string
  city: string
  companyName: string
  email: string
  logo: CMSMedia | null
  messengerUrl: string
  phone: string
  workingHours: string
}

export const DEFAULT_COMPANY_SETTINGS: CMSCompanySettings = {
  additionalPhone: '+7 (000) 000-00-01',
  address: 'Адрес офиса уточняется',
  brandSlogan: 'Ритуальная служба',
  city: 'Москва',
  companyName: 'Ритуальная служба «Память»',
  email: '',
  logo: null,
  messengerUrl: '',
  phone: '+7 (000) 000-00-00',
  workingHours: 'Круглосуточно, без выходных',
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
