import type { Metadata } from 'next'
import SiteApp from '@/SiteApp'
import { getPriceItems } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Цены',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const priceItems = await getPriceItems()
  return <SiteApp page="prices" priceItems={priceItems} />
}
