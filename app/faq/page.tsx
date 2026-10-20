import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'
import { getFAQs } from '../../src/lib/cms'

export const metadata: Metadata = { title: 'Часто задаваемые вопросы' }

export default async function Page() {
  const faqs = await getFAQs()
  return <SiteApp page="faq" faqs={faqs} />
}
