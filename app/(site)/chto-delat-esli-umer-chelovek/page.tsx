import SiteApp from '@/SiteApp'
import GuidePage from '@/guide/GuidePage'
import { guidePath, guideSlug } from '@/guide/data'
import { getGuideInstructions } from '@/lib/cms'
import { staticMetadata } from '@/seo/public'

export const dynamic = 'force-dynamic'
export const generateMetadata = staticMetadata(guidePath)

export default async function Page() {
  return <SiteApp page={guideSlug}><GuidePage data={await getGuideInstructions()}/></SiteApp>
}

