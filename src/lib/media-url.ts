import { siteOrigin } from '../seo/config'

const publicFile = /^\/api\/media\/file\/[^/?#]+$/

export function mediaURL(url: string, updatedAt: unknown) {
  if (typeof updatedAt !== 'string') return url
  const origin = siteOrigin()
  const file = URL.parse(url, origin)
  if (!file || file.origin !== origin || !publicFile.test(file.pathname) || file.search || file.hash) return url
  const revision = Date.parse(updatedAt)
  return Number.isFinite(revision) ? `${file.pathname}?v=${revision}` : url
}

export function isVersionedMedia(url: URL) {
  return publicFile.test(url.pathname) && /^\?v=\d{13}$/.test(url.search)
}
