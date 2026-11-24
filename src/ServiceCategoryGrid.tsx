import type { CMSService } from './lib/cms-types'

type CategoryService = Pick<CMSService, 'id' | 'title' | 'category' | 'sortOrder'>

export default function ServiceCategoryGrid({ services, links }: {
  services: readonly CategoryService[]
  links: ReadonlyMap<CMSService['id'], string>
}) {
  const categories = new Map<string, { title: string; services: CategoryService[] }>()

  // The first service in each group determines the category order.
  for (const service of [...services].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const title = service.category?.replace(/\s+/g, ' ').trim() || 'Другие услуги'
    const key = title.toLocaleLowerCase('ru')
    const category = categories.get(key)
    if (category) category.services.push(service)
    else categories.set(key, { title, services: [service] })
  }

  return (
    <div className="service-category-grid">
      {[...categories].map(([key, category]) => (
        <section className="service-category" key={key}>
          <h2>{category.title}</h2>
          <ul>
            {category.services.map(({ id, title }) => {
              const href = links.get(id)
              return <li key={id}>{href ? <a href={href}>{title}</a> : <span>{title}</span>}</li>
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
