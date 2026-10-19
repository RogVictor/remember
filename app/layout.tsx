import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Ритуальная служба «Память» — Москва',
    template: '%s | Ритуальная служба «Память»',
  },
  description: 'Информация об услугах по организации похорон, ритуальных принадлежностях и порядке обращения. Москва.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>
}
