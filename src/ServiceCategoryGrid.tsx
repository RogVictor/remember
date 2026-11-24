import type { CMSService } from './lib/cms-types'
import type { ServiceCategoryGroup } from './lib/service-categories'

type ServiceLinks = ReadonlyMap<CMSService['id'], string>

export function ServiceCategoryHeadings({ group, links }: { group: ServiceCategoryGroup; links: ServiceLinks }) {
  const linked = group.services.filter(service => links.has(service.id))
  if (!linked.length) return null
  return <section>
    <h2>Услуги направления</h2>
    {linked.map(service => <section key={service.id}>
      <h3><a href={links.get(service.id)}>{service.pageTitle || service.title}</a></h3>
      {service.summary && <p>{service.summary}</p>}
    </section>)}
  </section>
}

export function ServiceCategorySection({ group, links, href }: {
  group: ServiceCategoryGroup
  links: ServiceLinks
  href?: string
}) {
  return (
    <section className="service-category">
      <h2>{href ? <a className="service-category-title" href={href}>{group.title}</a> : group.title}</h2>
      <ul>
        {group.services.map(({ id, title }) => {
          const serviceHref = links.get(id)
          return <li key={id}>{serviceHref ? <a href={serviceHref}>{title}</a> : <span>{title}</span>}</li>
        })}
      </ul>
    </section>
  )
}

export default function ServiceCategoryGrid({ groups, serviceLinks, categoryLinks }: {
  groups: readonly ServiceCategoryGroup[]
  serviceLinks: ServiceLinks
  categoryLinks: ServiceLinks
}) {
  return (
    <div className="service-category-grid">
      {groups.map(group => (
        <ServiceCategorySection
          key={group.key}
          group={group}
          links={serviceLinks}
          href={group.categoryId == null ? undefined : categoryLinks.get(group.categoryId)}
        />
      ))}
    </div>
  )
}
