import type { CMSService, CMSServiceCategory } from './cms-types'

export type ServiceCategoryGroup = {
  key: string
  title: string
  categoryId: CMSServiceCategory['id'] | null
  services: CMSService[]
}

export function groupServices(services: readonly CMSService[], categories: readonly CMSServiceCategory[]) {
  const normalize = (title: string) => title.replace(/\s+/g, ' ').trim()
  const titleKey = (title: string) => normalize(title).toLocaleLowerCase('ru')
  const byID = new Map(categories.map(category => [category.id, category]))
  const byTitle = new Map<string, CMSServiceCategory | null>()
  for (const category of categories) {
    const key = titleKey(category.title)
    byTitle.set(key, byTitle.has(key) ? null : category)
  }

  const groups = new Map<string, ServiceCategoryGroup>()
  for (const service of [...services].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const legacyTitle = normalize(service.category ?? '') || 'Другие услуги'
    const category = service.serviceCategoryId == null
      ? byTitle.get(titleKey(legacyTitle))
      : byID.get(service.serviceCategoryId)
    const key = category ? `category:${category.id}` : `title:${titleKey(legacyTitle)}`
    const group = groups.get(key)
    if (group) {
      group.services.push(service)
    } else {
      groups.set(key, {
        key,
        title: category ? normalize(category.title) : legacyTitle,
        categoryId: category?.id ?? null,
        services: [service],
      })
    }
  }
  return [...groups.values()]
}
