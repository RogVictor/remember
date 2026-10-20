import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'
import { getPriceItems } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Цены',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const priceItems = await getPriceItems()
  return <SiteApp page="prices" priceItems={priceItems} />
}
