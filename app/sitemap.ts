import type { MetadataRoute } from 'next'
import { getPublishedPageSlugs } from '../src/lib/cms'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const staticPaths = ['/', '/services', '/funeral', '/products', '/prices', '/about', '/info', '/faq', '/contacts', '/legal']
  const cmsPaths = (await getPublishedPageSlugs())
    .filter((slug) => !staticPaths.includes(`/${slug}`))
    .map((slug) => `/${slug}`)
  return [...staticPaths, ...cmsPaths].map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }))
}
