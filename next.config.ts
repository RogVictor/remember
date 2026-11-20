import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  serverExternalPackages: ['undici'],
  // Payload Admin/API выполняются на Node.js; приложение не требует edge runtime.
}

export default withPayload(nextConfig)
