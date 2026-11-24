export function siteOrigin() {
  return new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin
}

export function indexingEnabled() {
  return process.env.SEO_INDEXING_ENABLED === 'true'
}
