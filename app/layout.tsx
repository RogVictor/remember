import type { Metadata } from 'next'
import './globals.css'
import './catalog.css'
import { getCompanySettings } from '../src/lib/cms'

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: {
      default: `${company.companyName} — ${company.city}`,
      template: `%s | ${company.companyName}`,
    },
    description: `Информация об услугах по организации похорон, ритуальных принадлежностях и порядке обращения. ${company.city}.`,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    robots: { index: false, follow: false },
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>
}
