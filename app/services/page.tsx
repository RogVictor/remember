import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'
import { getServices } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Ритуальные услуги',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const services = await getServices()
  return <SiteApp page="services" services={services} />
}
