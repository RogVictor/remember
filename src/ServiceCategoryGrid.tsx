import Link from 'next/link'
import type { CMSService } from './lib/cms-types'
import type { ServiceCategoryGroup } from './lib/service-categories'
import CatalogBrowser from './CatalogBrowser'

type ServiceLinks = ReadonlyMap<CMSService['id'], string>

export function ServiceCategoryHeadings({ group, links }: { group: ServiceCategoryGroup; links: ServiceLinks }) {
  return <section className="category-services">
    <h2>Услуги направления</h2>
    {group.services.map(service => {
      const href = links.get(service.id)
      const title = service.pageTitle || service.title
      return <section className="category-service-row" key={service.id}>
        {service.image && <img src={service.image.src ?? service.image.url} srcSet={service.image.srcSet} sizes="auto, 100vw" alt={service.image.alt} loading="lazy" />}
        <div>
          <h3>{href ? <Link prefetch={false} href={href}>{title}</Link> : title}</h3>
          {service.summary && <p>{service.summary}</p>}
          {href && <Link prefetch={false} className="service-read" href={href} aria-label={`Подробнее об услуге «${title}»`}>Об услуге <span aria-hidden="true">→</span></Link>}
        </div>
      </section>
    })}
  </section>
}

export function ServiceCategorySection({ group, links }: { group: ServiceCategoryGroup; links: ServiceLinks }) {
  return <section className="related-services">
    <h2>{group.title}</h2>
    <ul>{group.services.map(({ id, title }) => {
      const href = links.get(id)
      return <li key={id}>{href ? <Link prefetch={false} href={href}>{title}<span aria-hidden="true">→</span></Link> : title}</li>
    })}</ul>
  </section>
}

export default function ServiceCategoryGrid({ groups, serviceLinks, categoryLinks }: {
  groups: readonly ServiceCategoryGroup[]
  serviceLinks: ServiceLinks
  categoryLinks: ServiceLinks
}) {
  return <CatalogBrowser groups={groups.map(group => ({
    key: group.key,
    title: group.title,
    image: group.image,
    href: group.categoryId == null ? undefined : categoryLinks.get(group.categoryId),
    services: group.services.map(({ id, title }) => ({ id, title, href: serviceLinks.get(id) })),
  }))} />
}
