import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'
import ServiceCategoryGrid from '../../src/ServiceCategoryGrid'
import { getServiceCategoryLinks, getServices } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Ритуальные услуги',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const services = await getServices()
  const links = await getServiceCategoryLinks(services.data)

  return (
    <SiteApp page="services" services={services}>
      <ServiceCategoryGrid services={services.data} links={links} />
    </SiteApp>
  )
}
