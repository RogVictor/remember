import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'

export const generateMetadata = staticMetadata('/about')

export default function Page() { return <SiteApp page="about" /> }
