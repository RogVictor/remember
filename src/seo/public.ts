import 'server-only'

import { guidePath, guideDescription } from '../guide/data'
import { cache } from 'react'
import { getCompanySettings, getInactiveLandingIds, getPublishedInfoArticles, getPublishedPage, getServiceCatalog, getStaticSeo, relationshipID } from '../lib/cms'
import { indexingEnabled, siteOrigin } from './config'
import { inspectContent } from './content'
import { metadata, type SeoInput } from './metadata'
import { landingPath, staticRoutes, type StaticRoute } from './routes'
import type { Breadcrumb } from './structuredData'

function companyDescription(city: string) {
  return `Информация об услугах по организации похорон, ритуальных принадлежностях и порядке обращения. ${city}.`
}

export const staticSeoInput = cache(async (path: StaticRoute): Promise<SeoInput> => {
  const [company, fields] = await Promise.all([getCompanySettings(), getStaticSeo(path)])
  return {
    title: path === '/funeral' ? 'Организация похорон в Москве и Московской области — Эконом, Стандарт, VIP' : path === guidePath ? 'Что делать, если умер человек в Москве и Московской области — RitualGroup24' : path === '/' ? `${company.companyName} — ${company.city}` : staticRoutes[path],
    description: path === '/funeral' ? 'Организация похорон в Москве и Московской области. Комплексы для захоронения и кремации, состав ритуальных услуг и помощь в организации церемонии.' : path === guidePath ? guideDescription : companyDescription(company.city),
    companyName: path === '/' || path === guidePath ? undefined : company.companyName,
    path, origin: siteOrigin(), fields, indexing: indexingEnabled(),
  }
})

export function staticMetadata(path: StaticRoute) {
  return async () => {
    const [input, company] = await Promise.all([staticSeoInput(path), getCompanySettings()])
    const result = metadata(input, input.fields?.schemaType === 'Article')
    if (result.openGraph) result.openGraph.siteName = company.companyName
    return result
  }
}

export const landingSeo = cache(async (slug: string) => {
  const page = await getPublishedPage(slug)
  const path = landingPath(slug)
  if (!page || !path) return null
  const [catalog, company, articles, inactive] = await Promise.all([
    getServiceCatalog(), getCompanySettings(), getPublishedInfoArticles(), getInactiveLandingIds(),
  ])
  const article = articles.find(entry => entry.pageSlug === slug)
  const content = inspectContent(page.content)
  const categoryBlocks = new Set(content.blocks.filter(block => block.blockType === 'category-services')
    .map(block => relationshipID(block.category)))
  const category = catalog.groups.find(group => group.categoryId != null && catalog.categoryLinks.get(group.categoryId) === path)
  const extraCategory = category && !categoryBlocks.has(category.categoryId) ? category : undefined
  const catalogGroups = catalog.groups.filter(group => group === extraCategory || (group.categoryId != null && categoryBlocks.has(group.categoryId)))
  const serviceGroups = catalog.groups.filter(group => group.services.some(service => catalog.serviceLinks.get(service.id) === path))
  const matchingServices = serviceGroups.flatMap(group => group.services.filter(service => catalog.serviceLinks.get(service.id) === path))
  const service = matchingServices.length === 1 ? matchingServices[0] : undefined
  const breadcrumbs: Breadcrumb[] = []
  const hasCatalog = Boolean(category || catalogGroups.length)
  const parentGroup = !hasCatalog && serviceGroups.length === 1 ? serviceGroups[0] : undefined
  if (hasCatalog || serviceGroups.length) {
    breadcrumbs.push({ title: staticRoutes['/services'], path: '/services' })
    if (parentGroup?.categoryId != null) {
      const parent = catalog.categoryLinks.get(parentGroup.categoryId)
      if (parent && parent !== path && parent !== '/services') breadcrumbs.push({ title: parentGroup.title, path: parent })
    }
  } else if (article) {
    breadcrumbs.push({ title: staticRoutes['/info'], path: '/info' })
  }
  const inferred = hasCatalog ? 'OfferCatalog' : service ? 'Service' : article ? 'Article' : 'WebPage'
  const requested = page.schemaType
  const type = requested === 'WebPage' || requested === 'Article' || requested === 'Service'
    ? requested
    : requested === 'OfferCatalog' && catalogGroups.length ? requested : inferred
  const services = [...new Map(catalogGroups.flatMap(group => group.services).map(item => [
    item.id, { title: item.title, path: catalog.serviceLinks.get(item.id) },
  ])).values()]
  const related = parentGroup?.categoryId == null ? undefined : {
    ...parentGroup, title: 'Другие услуги категории',
    services: parentGroup.services.filter(item => {
      const href = catalog.serviceLinks.get(item.id)
      return href && href !== path
    }),
  }
  const input: SeoInput = {
    title: page.title, path, origin: siteOrigin(), fields: page, legacy: service, companyName: company.companyName,
    description: article?.description || service?.summary || content.text.split('\n').find(line => line.trim()) || companyDescription(company.city),
    indexing: indexingEnabled() && !inactive.has(page.id),
  }
  const landingKind = hasCatalog ? 'category' as const : serviceGroups.length ? 'service' as const : undefined
  return { input, page, company, type, services, breadcrumbs, related, extraCategory, landingKind, serviceLinks: catalog.serviceLinks }
})
