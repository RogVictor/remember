import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'
import { getProducts } from '@/lib/cms'

export const generateMetadata = staticMetadata('/products')

export const dynamic = 'force-dynamic'

export default async function Page() {
  const products = await getProducts()
  return <SiteApp page="products" products={products} />
}
