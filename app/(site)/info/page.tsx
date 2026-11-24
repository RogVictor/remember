import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'
import { getPublishedInfoArticles } from '@/lib/cms'

export const generateMetadata = staticMetadata('/info')

export default async function Page() {
  const infoArticles = await getPublishedInfoArticles()
  return <SiteApp page="info" infoArticles={infoArticles} />
}
