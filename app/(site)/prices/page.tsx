import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'
import { getPriceItems } from '@/lib/cms'

export const generateMetadata = staticMetadata('/prices')

export const dynamic = 'force-dynamic'

export default async function Page() {
  const priceItems = await getPriceItems()
  return <SiteApp page="prices" priceItems={priceItems} />
}
