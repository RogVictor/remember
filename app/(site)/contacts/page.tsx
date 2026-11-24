import { staticMetadata } from '@/seo/public'
import SiteApp from '@/SiteApp'

export const generateMetadata = staticMetadata('/contacts')

export default function Page() { return <SiteApp page="contacts" /> }
