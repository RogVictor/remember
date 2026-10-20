import SiteApp from '../src/SiteApp'
import { getFAQs, getPriceItems, getServices } from '../src/lib/cms'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [services, priceItems, faqs] = await Promise.all([
    getServices(),
    getPriceItems(),
    getFAQs(),
  ])

  return <SiteApp page="home" services={services} priceItems={priceItems} faqs={faqs} />
}
