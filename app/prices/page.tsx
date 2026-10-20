import type { Metadata } from 'next'
import App from '../../src/App'
import { getPriceItems } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Цены',
  description: 'Ритуальная служба «Память» в Москве. Информация и консультации по организации похорон.',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const priceItems = await getPriceItems()
  return <App page="prices" priceItems={priceItems} />
}
