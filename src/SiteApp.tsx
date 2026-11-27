import type { ComponentProps } from 'react'
import { guideSlug, guideFaq } from './guide/data'
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
  const navigation = catalog.groups.map(group => ({
    key: group.key,
    title: group.title,
    image: group.image,
    href: group.categoryId == null ? undefined : catalog.categoryLinks.get(group.categoryId),
    services: group.services.flatMap(({ id, title }) => {
      const href = catalog.serviceLinks.get(id)
      return href ? [{ id, title, href }] : []
    }),
  }))
  const page = props.page ?? 'home'
  const path = page === 'home' ? '/' : `/${page}` as const
  const seo = path === '/cms' || page === 'funeral' || page === 'about' ? null : await staticSeoInput(path)
  const faqs = page === guideSlug ? guideFaq : page === 'faq' ? props.faqs?.data : page === 'home' ? props.faqs?.data.slice(0, 3) : undefined
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
    <App {...props} company={company} navigation={navigation} />{chatConfigured() && <ChatWidget />}
  </>
}
