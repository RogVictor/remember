import type { Endpoint, Where } from 'payload'
import { indexedKeyword } from './keywordKey'
import { isStaticRoute, landingPath, staticRoutes } from './routes'

export const keywordConflicts: Endpoint = {
  path: '/seo-conflicts',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Требуется вход' }, { status: 401 })
    const keyword = indexedKeyword(req.query.keyword)
    if (!keyword) return Response.json({ matches: [], hasMore: false })

    const id = req.query.id
    const current = req.query.collection
    const search = (collection: 'pages' | 'site-seo') => {
      const and: Where[] = [{ _status: { equals: 'published' } }, { focusKeywordKey: { equals: keyword } }]
      if (current === collection && typeof id === 'string' && /^\d+$/.test(id)) and.push({ id: { not_equals: id } })
      return req.payload.find({ collection, req, overrideAccess: false, depth: 0, draft: false, limit: 10,
        where: { and }, sort: 'id' })
    }
    const [pages, sections] = await Promise.all([search('pages'), search('site-seo')])
    const matches = [
      ...pages.docs.flatMap(doc => {
        if (!('slug' in doc)) return []
        const path = landingPath(doc.slug)
        return path ? [{ title: doc.title, path }] : []
      }),
      ...sections.docs.flatMap(doc => 'route' in doc && typeof doc.route === 'string' && isStaticRoute(doc.route)
        ? [{ title: staticRoutes[doc.route], path: doc.route }] : []),
    ]
    return Response.json({ matches, hasMore: pages.hasNextPage || sections.hasNextPage },
      { headers: { 'Cache-Control': 'private, no-store' } })
  },
}
