'use client'

import { Hamburger, NavToggler, useNav, useTheme } from '@payloadcms/ui'

export function MobileNavToggle() {
  const { navOpen } = useNav()
  return <NavToggler className="rg-mobile-nav-toggle"><Hamburger closeIcon="x" isActive={navOpen} /></NavToggler>
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Включить светлую тему' : 'Включить тёмную тему'

  return (
    <button className="rg-theme-toggle" type="button" aria-label={label} title={label} onClick={() => setTheme(dark ? 'light' : 'dark')}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
          : <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z" />}
      </svg>
    </button>
  )
}
