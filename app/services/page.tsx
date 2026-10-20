import type { Metadata } from 'next'
import App from '../../src/App'
import { getServices } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Ритуальные услуги',
  description: 'Ритуальная служба «Память» в Москве. Информация и консультации по организации похорон.',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const services = await getServices()
  return <App page="services" services={services} />
}
