import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'
import { getFAQs } from '@/lib/cms'

export const generateMetadata = staticMetadata('/faq')

export default async function Page() {
  const faqs = await getFAQs()
  return <SiteApp page="faq" faqs={faqs} />
}
