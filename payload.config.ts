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
const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

if (process.env.NODE_ENV === 'production' && !isNextBuildPhase && (!secret || secret.length < 32 || secret.startsWith('replace-'))) {
  throw new Error('Set a unique PAYLOAD_SECRET (at least 32 characters) before running Payload in production.')
}

export default buildConfig({
  secret: secret || 'local-development-only-secret-change-before-production',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
  },
  collections: [Users, Pages, Services, Products, PriceItems, FAQs, Media, Leads],
  globals: [CompanySettings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgres://payload:payload@localhost:5433/funeral_site',
    },
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
