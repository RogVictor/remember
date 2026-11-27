import { aboutIcons, isAboutIcon } from './icons'

export function Icon({ name }: { name?: string | null }) {
  if (!isAboutIcon(name)) return null
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {aboutIcons[name].map(path => <path key={path} d={path} />)}
  </svg>
}
