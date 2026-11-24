import { serializeJsonLd, structuredData } from './structuredData'

export function JsonLd(props: Parameters<typeof structuredData>[0]) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData(props)) }} />
}
