import type { Metadata } from 'next'
import SiteApp from '../../src/SiteApp'

export const metadata: Metadata = { title: 'О компании' }

export default function Page() { return <SiteApp page="about" /> }
