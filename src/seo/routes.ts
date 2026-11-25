import { guidePath, guideTitle } from '../guide/data'

export const staticRoutes = {
  [guidePath]: guideTitle,
  '/': 'Ритуальные услуги и организация похорон',
  '/services': 'Ритуальные услуги',
  '/funeral': 'Организация похорон',
  '/products': 'Ритуальные товары',
  '/prices': 'Цены',
  '/about': 'О компании',
  '/info': 'Полезная информация',
  '/faq': 'Часто задаваемые вопросы',
  '/contacts': 'Контакты',
  '/legal': 'Политика конфиденциальности',
} as const

export type StaticRoute = keyof typeof staticRoutes

export function staticHeading(path: StaticRoute) {
  if (path === '/products') return 'Ритуальные принадлежности'
  if (path === '/prices') return 'Цены на ритуальные услуги'
  return staticRoutes[path]
}

export function isStaticRoute(path: string): path is StaticRoute {
  return Object.hasOwn(staticRoutes, path)
}

export function landingPath(slug: unknown): string | null {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  const path = `/${slug}`
  return isStaticRoute(path) || path === '/admin' || path === '/api' ? null : path
}
