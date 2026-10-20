import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'

export const metadata: Metadata = { title: 'Организация похорон' }

export default function Page() { return <SiteApp page="funeral" /> }
