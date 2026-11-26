import type { MetadataRoute } from 'next'
import { offerIndex, offerPath } from '../src/funeral/data'
import { getInactiveLandingIds, getPublicSeoEntries } from '../src/lib/cms'
import { indexingEnabled, siteOrigin } from '../src/seo/config'
import { canonicalURL } from '../src/seo/model'
import { landingPath, staticRoutes } from '../src/seo/routes'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexingEnabled()) return []
  const origin = siteOrigin()
  const [{ pages, sections }, inactive] = await Promise.all([getPublicSeoEntries(), getInactiveLandingIds()])
  const publishedSections = new Map(sections.map(section => [section.route, section]))
  const entries = [
    ...(await offerIndex()).map(o=>({path:offerPath(o),fields:{updatedAt:o.updatedAt,robots:undefined,canonicalOverride:undefined}})),
    ...Object.keys(staticRoutes).map(path => ({ path, fields: publishedSections.get(path as keyof typeof staticRoutes) })),
    ...pages.filter(page => !inactive.has(page.id)).map(page => ({ path: landingPath(page.slug), fields: page })),
  ]
  return entries.flatMap(({ path, fields }) => {
    if (!path || fields?.robots?.index === false) return []
    const url = canonicalURL(origin, path)
    if (canonicalURL(origin, path, fields?.canonicalOverride) !== url) return []
    return [{ url, lastModified: fields?.updatedAt }]
  })
}
