import type { Metadata } from 'next'
import SiteApp from '@/SiteApp'
import { getPublishedInfoArticles } from '@/lib/cms'

export const metadata: Metadata = { title: 'Полезная информация' }

export default async function Page() {
  const infoArticles = await getPublishedInfoArticles()
  return <SiteApp page="info" infoArticles={infoArticles} />
}
