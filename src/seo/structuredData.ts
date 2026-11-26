export type Breadcrumb = { title: string; path: string }
type Company = {
  companyName: string
  city?: string
  logo?: { url: string } | null
  schemaOrganizationType?: 'Organization' | 'FuneralHome'
  serviceRegions?: string[]
}
type FAQ = { question: string; answer: string }
type SchemaInput = {
  origin: string
  path: string
  title: string
  description?: string
  company: Company
  breadcrumbs?: Breadcrumb[]
  type?: 'WebPage' | 'Service' | 'OfferCatalog' | 'Article' | 'FAQPage'
  fixedPrice?: number | null
  dateModified?: string
  services?: { title: string; path?: string }[]
  faqs?: FAQ[]
}

export function structuredData(input: SchemaInput) {
  const { origin, path, title, description, company, breadcrumbs = [], type, services = [], faqs = [] } = input
  const home = new URL('/', origin).href
  const url = new URL(path, origin).href
  const organization = { '@id': `${home}#organization` }
  const website = { '@id': `${home}#website` }
  const regions = company.serviceRegions?.length ? company.serviceRegions : company.city ? [company.city] : []
  const areaServed = regions.length ? [...new Set(regions)].map(name => ({ '@type': 'AdministrativeArea', name })) : undefined
  const graph: Record<string, unknown>[] = [
    { '@type': company.schemaOrganizationType ?? 'Organization', ...organization, name: company.companyName, url: home,
      logo: company.logo?.url ? new URL(company.logo.url, origin).href : undefined, areaServed },
    { '@type': 'WebSite', ...website, name: company.companyName, url: home, inLanguage: 'ru', publisher: organization },
  ]
  const page: Record<string, unknown> = { '@type': faqs.length && type === 'FAQPage' ? 'FAQPage' : 'WebPage',
    '@id': `${url}#webpage`, url, name: title, description, isPartOf: website, inLanguage: 'ru' }
  if (path !== '/') {
    const id = `${url}#breadcrumbs`
    page.breadcrumb = { '@id': id }
    graph.push({ '@type': 'BreadcrumbList', '@id': id, itemListElement: [
      { title: 'Главная', path: '/' }, ...breadcrumbs, { title, path },
    ].map(({ title: name, path: itemPath }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: new URL(itemPath, origin).href,
    })) })
  }
  const entity = { '@id': `${url}#main`, name: title, description }
  const service = (name: string, servicePath?: string) => ({
    '@type': 'Service', name, url: servicePath ? new URL(servicePath, origin).href : undefined, provider: organization, areaServed,
  })
  if (type === 'Service') {
    graph.push({ ...service(title, path), ...entity, offers: input.fixedPrice && input.fixedPrice > 0 ? {
      '@type':'Offer', priceCurrency:'RUB', price:input.fixedPrice, url,
    } : undefined })
    if (faqs.length) graph.push({ '@type':'FAQPage','@id':url+'#faq',mainEntity:faqs.map(q=>({
      '@type':'Question',name:q.question,acceptedAnswer:{'@type':'Answer',text:q.answer},
    })) })
    page.mainEntity = { '@id': entity['@id'] }
  } else if (type === 'OfferCatalog' && services.length) {
    graph.push({ '@type': 'OfferCatalog', ...entity, itemListElement: services.map(({ title, path }) => service(title, path)) })
    page.mainEntity = { '@id': entity['@id'] }
  } else if (type === 'Article') {
    graph.push({ '@type': 'Article', ...entity, headline: title, publisher: organization,
      dateModified: input.dateModified, mainEntityOfPage: { '@id': page['@id'] } })
    page.mainEntity = { '@id': entity['@id'] }
  } else if (page['@type'] === 'FAQPage') {
    page.mainEntity = faqs.map(({ question, answer }) => ({
      '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer },
    }))
  }
  graph.push(page)
  return { '@context': 'https://schema.org', '@graph': graph }
}

export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
