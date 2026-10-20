import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'

export const metadata: Metadata = { title: 'Контакты' }

export default function Page() { return <SiteApp page="contacts" /> }
