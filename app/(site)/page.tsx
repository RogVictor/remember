import SiteApp from '@/SiteApp'
import { staticMetadata } from '@/seo/public'
import { getGuideInstructions, getFAQs, getPriceItems, getServices } from '@/lib/cms'

export const dynamic = 'force-dynamic'
export const generateMetadata = staticMetadata('/')

export default async function HomePage() {
  const [services, priceItems, faqs, guideData] = await Promise.all([
    getServices(),
    getPriceItems(),
    getFAQs(),
    getGuideInstructions(),
  ])

  return <SiteApp page="home" guideData={guideData} services={services} priceItems={priceItems} faqs={faqs} />
}
