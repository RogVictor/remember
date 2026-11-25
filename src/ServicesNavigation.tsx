'use client'

import { Fragment, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CMSMedia } from './lib/cms-types'

export type NavigationCategory = {
  key: string
  title: string
  image?: CMSMedia | null
  href?: string
  services: { id: string | number; title: string; href: string }[]
}

const desktop = () => window.matchMedia('(min-width: 1001px)').matches
const catalogHref = '/services'

export default function ServicesNavigation({ categories, current }: {
  categories: NavigationCategory[]
  current: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const openedByHover = useRef(false)
  const menuId = useId()

  function show(hover = false) {
    openedByHover.current = hover
    setSelected(desktop() ? 0 : null)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return <div className="services-nav" ref={root} onPointerLeave={event => {
    if (event.pointerType === 'mouse' && openedByHover.current && !root.current?.contains(document.activeElement)) setOpen(false)
  }} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={event => {
    if (open && event.key === 'Escape') {
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
  }}>
    <button ref={trigger} type="button" className={`services-trigger ${current || open ? 'active' : ''}`}
      aria-expanded={open} aria-controls={menuId}
      onPointerEnter={event => { if (!open && desktop() && event.pointerType === 'mouse') show(true) }}
      onClick={() => {
        if (open && openedByHover.current) openedByHover.current = false
        else if (open) setOpen(false)
        else show()
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          if (!open) show()
          requestAnimationFrame(() => buttons.current[0]?.focus())
        }
      }}>Услуги <i className="nav-chevron" aria-hidden="true" /></button>
    {open && <div className="mega-menu" id={menuId}>
      <div className="mega-top"><span>Направления услуг</span><Link prefetch={false} onNavigate={() => setOpen(false)} href={catalogHref} aria-current={current ? 'page' : undefined}>Полный каталог <span aria-hidden="true">↗</span></Link></div>
      <div className="mega-columns" style={{ gridTemplateRows: `repeat(${Math.max(1, categories.length)}, auto)` }}>
        {categories.map((category, index) => {
          const active = selected === index
          const panelId = menuId + '-group-' + index
          return <Fragment key={category.key}>
            <button type="button" className="mega-category" ref={node => { buttons.current[index] = node }}
              style={{ gridRow: index + 1 }} aria-expanded={active} aria-controls={active ? panelId : undefined}
              onPointerEnter={event => { if (desktop() && event.pointerType === 'mouse') setSelected(index) }}
              onFocus={() => { if (desktop()) setSelected(index) }}
              onClick={() => {
                if (desktop()) {
                  setOpen(false)
                  router.push(catalogHref)
                } else {
                  setSelected(active ? null : index)
                }
              }}
              onKeyDown={event => {
                if (event.key === 'ArrowRight' && desktop()) {
                  event.preventDefault()
                  document.getElementById(panelId)?.querySelector('a')?.focus()
                  return
                }
                if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
                event.preventDefault()
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + categories.length) % categories.length
                buttons.current[next]?.focus()
              }}>{category.title}<i className="nav-chevron" aria-hidden="true" /></button>
            <div className="mega-detail" id={panelId} aria-hidden={!active} inert={!active} onKeyDown={event => {
              if (event.key === 'ArrowLeft') { event.preventDefault(); buttons.current[index]?.focus() }
            }}>
              {active && category.image && <img loading="lazy" src={category.image.src ?? category.image.url} srcSet={category.image.srcSet} sizes="auto, 100vw" alt={category.image.alt} />}
              <div className="mega-heading">{category.title}</div>
              <ul>{category.services.map(service => <li key={service.id}><Link prefetch={false} onNavigate={() => setOpen(false)} href={service.href}>{service.title}</Link></li>)}</ul>
              {category.href && <Link prefetch={false} onNavigate={() => setOpen(false)} className="mega-category-link" href={category.href}>Перейти в категорию <span aria-hidden="true">→</span></Link>}
            </div>
          </Fragment>
        })}
      </div>
    </div>}
  </div>
}
