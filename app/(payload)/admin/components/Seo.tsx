'use client'

import { Button, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'
import { analyze, characterCount, descriptionRange, duplicateKeywords, previewContent, titleRange } from '@/seo/analyze'
import { record } from '@/seo/content'
import { canonicalURL, keywordKey, spaces, type SeoFields } from '@/seo/model'
import { isStaticRoute, landingPath, staticRoutes } from '@/seo/routes'

function useSeoForm() {
  const fields = useFormFields(([state]) => state)
  const value = (path: string) => fields[path]?.value
  const route = value('route')
  const staticPath = typeof route === 'string' && isStaticRoute(route) ? route : null
  const title = spaces(value('title')) || (staticPath ? staticRoutes[staticPath] : '')
  const seo = {
    seoTitle: value('seoTitle'), seoDescription: value('seoDescription'), focusKeyword: value('focusKeyword'),
    ogImage: value('ogImage'), openGraph: { image: value('openGraph.image') }, canonicalOverride: value('canonicalOverride'),
    robots: { index: value('robots.index'), follow: value('robots.follow') }, schemaType: value('schemaType'),
  } as SeoFields
  const keywordRows = Object.entries(fields).filter(([path]) => /^(secondaryKeywords|relatedKeywords)\.\d+\.keyword$/.test(path))
  return { seo, title, content: value('content'), path: staticPath ?? landingPath(value('slug')),
    duplicates: duplicateKeywords([seo.focusKeyword, ...keywordRows.map(([, row]) => row.value)]) }
}

export function SeoPreview({ siteOrigin = 'http://localhost:3000' }: { siteOrigin?: string }) {
  const { seo, title, content, path } = useSeoForm()
  const previewTitle = seo.seoTitle?.trim() || title || 'Заголовок страницы'
  const previewDescription = seo.seoDescription?.trim() || previewContent(content) || 'Описание подставляется из публичного контента.'
  const counters = [
    ['Title', seo.seoTitle, titleRange], ['Description', seo.seoDescription, descriptionRange],
  ] as const
  return <div className="rg-seo">
    <div className="rg-seo__counts">{counters.map(([label, value, [min, max]]) =>
      <span key={label}>{label} · {characterCount(value ?? '')} символов · ориентир {min}–{max}</span>)}</div>
    <div className="rg-seo__preview">
      <small>Приблизительный предпросмотр поисковой выдачи</small>
      {path && <div>{canonicalURL(siteOrigin, path, seo.canonicalOverride)}</div>}
      <strong>{previewTitle}</strong>
      <p>{previewDescription}</p>
      <small>Поисковые системы могут изменить заголовок и описание.</small>
    </div>
  </div>
}

type Match = { title: string; path: string }

export function SeoAnalyzer({ siteOrigin = 'http://localhost:3000' }: { siteOrigin?: string }) {
  const { seo, title, content, duplicates } = useSeoForm()
  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()
  const keyword = keywordKey(seo.focusKeyword)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ keyword: string; matches?: Match[]; hasMore?: boolean }>({ keyword: '' })
  const [assets, setAssets] = useState(new Map<number, Record<string, unknown>>())
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const { checks, mediaIds } = analyze(seo, { h1: title, content, assets, origin: siteOrigin, staticRoute: collectionSlug === 'site-seo' })
  const checkMedia = async () => {
    setMediaStatus('loading')
    const params = new URLSearchParams({ 'where[id][in]': mediaIds.slice(0, 30).join(','),
      depth: '0', limit: '30', 'select[alt]': 'true', 'select[decorative]': 'true' })
    try {
      const response = await fetch(`${config.routes.api}/media?${params}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Media check failed')
      const { docs } = await response.json() as { docs: { id: number; alt?: string | null; decorative?: boolean | null }[] }
      setAssets(previous => new Map([...previous, ...docs.map(doc => [doc.id, { ...doc, alt: doc.alt ?? '' }] as const)]))
      setMediaStatus('done')
    } catch {
      setMediaStatus('error')
    }
  }
  const labels = { pass: 'Пройдено', tip: 'Рекомендация', problem: 'Проблема', neutral: 'Не проверено / не применимо' }
  const check = async () => {
    setPending(true)
    const params = new URLSearchParams({ keyword, id: id == null ? '' : String(id), collection: collectionSlug ?? '' })
    try {
      const response = await fetch(`${config.routes.api}/pages/seo-conflicts?${params}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Keyword check failed')
      const { matches, hasMore } = await response.json() as { matches: Match[]; hasMore: boolean }
      setResult({ keyword, matches, hasMore })
    } catch {
      setResult({ keyword })
    } finally {
      setPending(false)
    }
  }

  return <div className="rg-seo">
    <ul className="rg-seo__checks">
      {checks.map(({ label, status, note }) => <li key={label}>
        <span className={`rg-seo__status rg-seo__status--${status}`}>{labels[status]}</span>
        <span><strong>{label}</strong><br />{note}</span>
      </li>)}
    </ul>
    {mediaIds.length > 0 && <Button buttonStyle="secondary" size="small" type="button"
      disabled={mediaStatus === 'loading'} onClick={checkMedia}>Проверить ALT из медиатеки</Button>}
    {mediaStatus === 'error' && <p role="status">Данные медиатеки сейчас недоступны.</p>}
    {mediaStatus === 'done' && mediaIds.length > 0 && <p role="status">Часть изображений ещё не проверена.</p>}
    {duplicates.length > 0 && <p role="status">Повторы в семантике: {duplicates.join(', ')}.</p>}
    <Button buttonStyle="secondary" size="small" type="button" disabled={!keyword || pending} onClick={check}>
      Проверить совпадения запроса
    </Button>
    <div aria-live="polite">
      {pending ? <p>Проверяем опубликованные страницы…</p> : !keyword || keyword !== result.keyword
        ? <p>Проверка совпадений запускается по кнопке.</p> : !result.matches ? <p>Проверка сейчас недоступна.</p>
        : result.matches.length === 0 ? <p>Совпадений среди доступных опубликованных страниц нет.</p>
        : <>
          <p>Одинаковый основной запрос. Для вывода о каннибализации нужна проверка поисковых данных.</p>
          <ul>{result.matches.map(({ title, path }) => <li key={path}>
            <a href={path} target="_blank" rel="noreferrer">{title} · {path}</a>
          </li>)}</ul>
          {result.hasMore && <p>Показаны первые найденные страницы.</p>}
        </>}
    </div>
  </div>
}

export function LinkedSeo({ legacy = false }: { legacy?: boolean }) {
  const page = useFormFields(([fields]) => fields.page?.value)
  const id = record(page)?.id ?? page
  const { config } = useConfig()
  return <div className="rg-seo">
    {typeof id === 'number' || typeof id === 'string'
      ? <a href={`${config.routes.admin}/collections/pages/${encodeURIComponent(id)}`}>Открыть связанную страницу для редактирования SEO</a>
      : <p>Выберите опубликованную страницу в поле связи. Для фиксированного URL используйте коллекцию «SEO разделов».</p>}
    {legacy && <p>Резервные поля используются для однозначно связанной услуги, когда соответствующие поля посадочной пусты.</p>}
  </div>
}
