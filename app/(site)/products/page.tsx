import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'
import { productOfferLinks } from '@/funeral/data'
import { getProducts } from '@/lib/cms'

export const generateMetadata = staticMetadata('/products')

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [products, links] = await Promise.all([
    getProducts(),
    productOfferLinks(),
  ])
  const data = products.data.map((product) => ({
    ...product,
    offers: links.get(Number(product.id)),
  }))
  return <SiteApp page="products" products={{ ...products, data }} />
}
