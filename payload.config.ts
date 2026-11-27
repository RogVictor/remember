import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { PublicDocuments } from './collections/PublicDocuments'
import { Services } from './collections/Services'
import { ServiceCategories } from './collections/ServiceCategories'
import { Products } from './collections/Products'
import { PriceItems } from './collections/PriceItems'
import { FAQs } from './collections/FAQs'
import { InfoArticles } from './collections/InfoArticles'
import { Media } from './collections/Media'
import { Leads } from './collections/Leads'
import { FuneralCategories, FuneralOffers, FuneralSettings } from './collections/FuneralOffers'
import { ChatSessions, ChatMessages } from './collections/Chat'
import { CompanySettings } from './globals/CompanySettings'
import { SiteSeo } from './collections/SiteSeo'
import { siteOrigin as getSiteOrigin } from './src/seo/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const secret = process.env.PAYLOAD_SECRET
const databaseURL = process.env.DATABASE_URL
const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const configuredSiteURL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
const siteOrigin = getSiteOrigin()
const extraOrigins = (process.env.PAYLOAD_EXTRA_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = [siteOrigin, ...extraOrigins]

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
  cors: allowedOrigins,
  csrf: allowedOrigins,
  i18n: { fallbackLanguage: 'ru', supportedLanguages: { ru } },
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: ' · RitualGroup24 Admin' },
    components: {
      actions: ['/app/(payload)/admin/components/ThemeToggle', '/app/(payload)/admin/components/ThemeToggle#MobileNavToggle'],
      beforeDashboard: ['/app/(payload)/admin/components/DashboardWelcome'],
      beforeNavLinks: ['/app/(payload)/admin/components/Brand#NavBrand'],
      graphics: {
        Icon: '/app/(payload)/admin/components/Brand#AdminIcon',
        Logo: '/app/(payload)/admin/components/Brand#AdminLogo',
      },
    },
  },
  collections: [Pages, SiteSeo, InfoArticles, FAQs, ServiceCategories, Services, Products, PriceItems, FuneralCategories, FuneralOffers, Leads, ChatSessions, ChatMessages, Media, PublicDocuments, Users],
  globals: [CompanySettings, FuneralSettings],
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
  typescript: { declare: false, outputFile: path.resolve(dirname, 'payload-types.ts') },
})
