import { isVersionedMedia } from '@/lib/media-url'
import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

const payloadGET = REST_GET(config)

export const GET: typeof payloadGET = async (request, context) => {
  const response = await payloadGET(request, context)
  if (response.status === 200 && isVersionedMedia(new URL(request.url)) &&
      /^image\/(png|jpeg|webp|avif)$/.test(response.headers.get('content-type') ?? '')) {
    response.headers.set('Cache-Control', 'private, max-age=31536000, immutable')
  }
  return response
}
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
