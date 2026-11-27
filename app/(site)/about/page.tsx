import { notFound } from 'next/navigation'
import SiteApp from '@/SiteApp'
import { AboutSections } from '@/about/Sections'
import { getCompanySettings, getConfirmedLegalDetails, getServiceCatalog, getStaticSeo } from '@/lib/cms'
import { JsonLd } from '@/seo/JsonLd'
import { resolveSeo } from '@/seo/metadata'
import { staticMetadata, staticSeoInput } from '@/seo/public'
import { staticRoutes } from '@/seo/routes'
import '@/about/about.css'

export const generateMetadata = staticMetadata('/about')

export default async function Page() {
  const page = await getStaticSeo('/about')
  if (!page) notFound()
  const [company, catalog, input, legal] = await Promise.all([
    getCompanySettings(), getServiceCatalog(), staticSeoInput('/about'),
    page.sections?.some(b => b.blockType === 'legal' && b.visible !== false) ? getConfirmedLegalDetails() : null,
  ])
  const seo = resolveSeo(input)
  const heading = page.sections?.find(b => b.blockType === 'hero' && b.visible !== false)?.title
  return <SiteApp page="about">
    <JsonLd origin={input.origin} path="/about" type="AboutPage" canonical={seo.canonical} company={company}
      title={heading?.trim() || staticRoutes['/about']} breadcrumbTitle={staticRoutes['/about']}
      description={seo.description} dateModified={page.updatedAt} />
    <AboutSections sections={page.sections} company={company} catalog={catalog} details={legal} />
  </SiteApp>
}
