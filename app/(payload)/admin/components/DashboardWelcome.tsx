import Link from 'next/link'
import type { SanitizedPermissions } from 'payload'

const shortcuts = [
  { slug: 'pages', label: 'Создать страницу' },
  { slug: 'services', label: 'Создать услугу' },
  { slug: 'service-categories', label: 'Создать категорию' },
  { slug: 'media', label: 'Добавить медиафайл' },
]

export default function DashboardWelcome({ permissions }: { permissions?: SanitizedPermissions }) {
  const links = shortcuts.filter(({ slug }) => permissions?.collections?.[slug]?.create)

  return (
    <section className="rg-dashboard-welcome">
      <h1>Добро пожаловать в RitualGroup24 Admin</h1>
      {links.length > 0 && (
        <ul aria-label="Быстрые действия">
          {permissions?.collections?.['site-seo']?.read && <li><Link href="/admin/collections/site-seo?where[route][equals]=%2Fabout">О компании</Link></li>}
          {links.map(({ slug, label }) => (
            <li key={slug}><Link href={`/admin/collections/${slug}/create`}>{label}</Link></li>
          ))}
        </ul>
      )}
    </section>
  )
}
