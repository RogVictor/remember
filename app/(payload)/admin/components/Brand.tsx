import Image from 'next/image'
import Link from 'next/link'
import { MobileNavToggle } from './ThemeToggle'

export function AdminIcon() {
  return <Image className="rg-brand-icon" src="/ritualgroup24_favicon.png" width={32} height={32} alt="" />
}

export function AdminLogo() {
  return <span className="rg-brand"><AdminIcon /><span>RitualGroup24 <small>Admin</small></span></span>
}

export function NavBrand() {
  return (
    <>
      <div className="rg-nav-brand-row">
        <Link className="rg-nav-brand" href="/admin" aria-label="RitualGroup24 Admin, главная"><AdminLogo /></Link>
        <MobileNavToggle />
      </div>
      <Link className="nav__link" href="/admin/about" prefetch={false}><span className="nav__link-label">О компании</span></Link>
    </>
  )
}
