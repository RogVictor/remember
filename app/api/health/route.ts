import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'users', overrideAccess: true })
    return NextResponse.json({ status: 'ok' })
  } catch {
    console.error('[Health] Application or database readiness check failed.')
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }
}
