import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'
import ServiceCategoryGrid from '@/ServiceCategoryGrid'
import { getServiceCatalog } from '@/lib/cms'

export const generateMetadata = staticMetadata('/services')

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { services, groups, serviceLinks, categoryLinks } = await getServiceCatalog()

  return (
    <SiteApp page="services" services={services}>
      <ServiceCategoryGrid groups={groups} serviceLinks={serviceLinks} categoryLinks={categoryLinks} />
    </SiteApp>
  )
}
