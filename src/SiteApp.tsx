import type { ComponentProps } from 'react'
import App from './App'
import ChatWidget from './ChatWidget'
import { chatConfigured } from './lib/chat-telegram'
import { getCompanySettings, getServiceCatalog } from './lib/cms'
import { JsonLd } from './seo/JsonLd'
import { resolveSeo } from './seo/metadata'
import { staticSeoInput } from './seo/public'
import { staticHeading } from './seo/routes'

export default async function SiteApp(props: ComponentProps<typeof App>) {
  const [company, catalog] = await Promise.all([getCompanySettings(), getServiceCatalog()])
  const services = props.services ?? catalog.services
  const serviceLinks = services.data.flatMap(({ id, title }) => {
    const href = catalog.serviceLinks.get(id)
    return href ? [{ id, title, href }] : []
  })
  const page = props.page ?? 'home'
  const path = page === 'home' ? '/' : `/${page}` as const
  const seo = path === '/cms' ? null : await staticSeoInput(path)
  const faqs = page === 'faq' ? props.faqs?.data : page === 'home' ? props.faqs?.data.slice(0, 3) : undefined
  const schema = seo?.fields?.schemaType
  const type = schema === 'WebPage' || schema === 'Service' || schema === 'Article' ? schema
    : page === 'services' ? 'OfferCatalog'
    : faqs?.length ? 'FAQPage'
    : page === 'funeral' ? 'Service' : 'WebPage'

  return <>
    {seo && path !== '/cms' && <JsonLd origin={seo.origin} path={path} title={staticHeading(path)}
      description={resolveSeo(seo).description} company={company} type={type}
      services={page === 'services' ? catalog.groups.flatMap(group => group.services.map(({ id, title }) => ({
        title, path: catalog.serviceLinks.get(id),
      }))) : undefined} faqs={faqs} />}
    <App {...props} company={company} serviceLinks={serviceLinks} />{chatConfigured() && <ChatWidget />}
  </>
}
