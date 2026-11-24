import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'

export const generateMetadata = staticMetadata('/funeral')

export default function Page() { return <SiteApp page="funeral" /> }
