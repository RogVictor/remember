import type { MetadataRoute } from 'next'
import { indexingEnabled, siteOrigin } from '../src/seo/config'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!indexingEnabled()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: new URL('/sitemap.xml', siteOrigin()).href,
  }
}
