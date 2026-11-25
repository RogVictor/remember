'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CMSMedia } from './lib/cms-types'

type Group = {
  key: string
  title: string
  image?: CMSMedia | null
  href?: string
  services: { id: string | number; title: string; href?: string }[]
}

const plural = new Intl.PluralRules('ru')
function serviceCount(n: number) {
  const form = plural.select(n)
  return `${n} ${form === 'one' ? 'услуга' : form === 'few' ? 'услуги' : 'услуг'}`
}

const normalize = (text: string) => text.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е')

export default function CatalogBrowser({ groups }: { groups: Group[] }) {
  const [selected, setSelected] = useState('')
  const [query, setQuery] = useState('')
  const search = normalize(query)
  const visible = groups.filter(group => !selected || selected === group.key).flatMap(group => {
    if (!search) return [group]
    const services = group.services.filter(service => normalize(service.title).includes(search))
    return services.length ? [{ ...group, services }] : []
  })
  const total = visible.reduce((sum, group) => sum + group.services.length, 0)

  return <>
    <div className="catalog-tools">
      <label><span>Направление</span>
        <select value={selected} onChange={event => setSelected(event.target.value)}>
          <option value="">Все направления ({groups.length})</option>
          {groups.map(group => <option key={group.key} value={group.key}>{group.title}</option>)}
        </select>
      </label>
      <label><span>Поиск по каталогу</span><div className="service-search">
        <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg>
        <input type="search" placeholder="Название услуги" value={query} onChange={event => setQuery(event.target.value)} />
      </div></label>
      <span className="catalog-total" role="status">{serviceCount(total)}</span>
    </div>
    {visible.length ? <div className="service-category-grid">
      {visible.map(group => <section key={group.key} className="catalog-group">
        {group.image && <img className="category-cover" src={group.image.src ?? group.image.url} srcSet={group.image.srcSet} sizes="auto, 100vw" alt={group.image.alt} loading="lazy" />}
        <div className="catalog-group-body">
          <span className="category-count">{serviceCount(group.services.length)}</span>
          <h2>{group.href ? <Link prefetch={false} href={group.href}>{group.title}<span aria-hidden="true">↗</span></Link> : group.title}</h2>
          <ul>{group.services.map(service => <li key={service.id}>{service.href
            ? <Link prefetch={false} href={service.href}>{service.title}</Link> : service.title}</li>)}</ul>
        </div>
      </section>)}
    </div> : <div className="catalog-no-results"><h2>Услуг по запросу не найдено</h2>
      <button type="button" onClick={() => { setSelected(''); setQuery('') }}>Показать все услуги</button>
    </div>}
  </>
}
