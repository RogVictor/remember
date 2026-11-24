import type { Metadata } from 'next'
import '../globals.css'
import '../catalog.css'
import { getCompanySettings } from '@/lib/cms'
import { siteOrigin } from '@/seo/config'

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: {
      default: `${company.companyName} — ${company.city}`,
      template: `%s | ${company.companyName}`,
    },
    description: `Информация об услугах по организации похорон, ритуальных принадлежностях и порядке обращения. ${company.city}.`,
    metadataBase: new URL(siteOrigin()),
    robots: { index: false, follow: false },
    icons: {
      icon: '/ritualgroup24_favicon.png',
      shortcut: '/ritualgroup24_favicon.png',
    },
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>
}
