import SiteApp from '@/SiteApp'
import { staticMetadata } from '@/seo/public'
import { getFAQs, getPriceItems, getServices } from '@/lib/cms'

export const dynamic = 'force-dynamic'
export const generateMetadata = staticMetadata('/')

export default async function HomePage() {
  const [services, priceItems, faqs] = await Promise.all([
    getServices(),
    getPriceItems(),
    getFAQs(),
  ])

  return <SiteApp page="home" services={services} priceItems={priceItems} faqs={faqs} />
}
