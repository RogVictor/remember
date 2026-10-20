import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { Services } from './collections/Services'
import { Products } from './collections/Products'
import { PriceItems } from './collections/PriceItems'
import { FAQs } from './collections/FAQs'
import { Media } from './collections/Media'
import { Leads } from './collections/Leads'
import { CompanySettings } from './globals/CompanySettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const secret = process.env.PAYLOAD_SECRET
const databaseURL = process.env.DATABASE_URL
const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const configuredSiteURL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
const siteURL = configuredSiteURL || 'http://localhost:3000'
const siteOrigin = new URL(siteURL).origin

if (!secret && !isNextBuildPhase) {
  throw new Error('Set PAYLOAD_SECRET before starting Payload.')
}
if (!databaseURL && !isNextBuildPhase) {
  throw new Error('Set DATABASE_URL before starting the application.')
}
if (process.env.NODE_ENV === 'production' && !isNextBuildPhase && (!secret || secret.length < 32 || secret.startsWith('replace-'))) {
  throw new Error('Set a unique PAYLOAD_SECRET (at least 32 characters) before running Payload in production.')
}
if (
  process.env.NODE_ENV === 'production' &&
  !isNextBuildPhase &&
  (!configuredSiteURL || new URL(configuredSiteURL).protocol !== 'https:')
) {
  throw new Error('Set SITE_URL to the canonical HTTPS origin before running Payload in production.')
}

export default buildConfig({
  secret: secret || '',
  serverURL: siteOrigin,
  cors: [siteOrigin],
  csrf: [siteOrigin],
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
  },
  collections: [Users, Pages, Services, Products, PriceItems, FAQs, Media, Leads],
  globals: [CompanySettings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL || 'postgres://127.0.0.1:5432/build-only',
    },
    disableCreateDatabase: process.env.NODE_ENV === 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
