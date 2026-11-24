import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'

export const generateMetadata = staticMetadata('/legal')

export default function Page() { return <SiteApp page="legal" /> }
