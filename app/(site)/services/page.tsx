import type { Metadata } from 'next'
import SiteApp from '@/SiteApp'
import ServiceCategoryGrid from '@/ServiceCategoryGrid'
import { getServiceCatalog } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Ритуальные услуги',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { services, groups, serviceLinks, categoryLinks } = await getServiceCatalog()

  return (
    <SiteApp page="services" services={services}>
      <ServiceCategoryGrid groups={groups} serviceLinks={serviceLinks} categoryLinks={categoryLinks} />
    </SiteApp>
  )
}
