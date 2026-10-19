import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  // Keep staging deployments out of search results. Enable indexing after
  // company details, pricing, privacy documents and forms are verified.
  return { rules: { userAgent: '*', disallow: '/' } }
}
