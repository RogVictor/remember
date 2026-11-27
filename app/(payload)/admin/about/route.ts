import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login?redirect=%2Fadmin%2Fabout')
  const { docs } = await payload.find({
    collection: 'site-seo', where: { route: { equals: '/about' } }, draft: true,
    user, overrideAccess: false, limit: 1, depth: 0, select: { route: true },
  })
  redirect(docs[0] ? `/admin/collections/site-seo/${docs[0].id}` : '/admin/collections/site-seo/create')
}
