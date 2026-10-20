import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'
import { getProducts } from '../../src/lib/cms'

export const metadata: Metadata = {
  title: 'Ритуальные товары',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const products = await getProducts()
  return <SiteApp page="products" products={products} />
}
