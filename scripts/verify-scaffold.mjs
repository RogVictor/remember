import fs from 'node:fs'
import path from 'node:path'

const required = [
  'payload.config.ts',
  'next.config.ts',
  'collections/Users.ts',
  'collections/Pages.ts',
  'collections/Services.ts',
  'collections/Products.ts',
  'collections/PriceItems.ts',
  'collections/FAQs.ts',
  'collections/Media.ts',
  'collections/Leads.ts',
  'globals/CompanySettings.ts',
  'app/(payload)/admin/layout.tsx',
  'app/(payload)/admin/[[...segments]]/page.tsx',
  'app/(payload)/api/[...slug]/route.ts',
  'docker-compose.yml',
  'Dockerfile',
  '.env.example',
]
const missing = required.filter((file) => !fs.existsSync(path.resolve(file)))
if (missing.length) {
  console.error('Missing required scaffold files:', missing.join(', '))
  process.exit(1)
}
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
for (const dependency of ['payload', '@payloadcms/next', '@payloadcms/db-postgres', '@payloadcms/richtext-lexical', 'sharp']) {
  if (!pkg.dependencies?.[dependency]) {
    console.error(`Missing dependency: ${dependency}`)
    process.exitCode = 1
  }
}
if (!process.exitCode) console.log(`Scaffold check passed: ${required.length} required files and CMS dependencies are present.`)
