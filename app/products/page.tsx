import type { Metadata } from 'next'
import App from '../../src/App'
import { getProducts } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Ритуальные товары',
  description: 'Ритуальная служба «Память» в Москве. Информация и консультации по организации похорон.',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const products = await getProducts()
  return <App page="products" products={products} />
}
