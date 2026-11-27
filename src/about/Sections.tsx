import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'
import type { CompanySetting, Media, SiteSeo } from '../../payload-types'
import { getServiceCatalog, media, relationshipID } from '../lib/cms'
import { DEFAULT_COMPANY_SETTINGS, type CMSCompanySettings } from '../lib/cms-types'
import { inspectContent, record } from '../seo/content'
import { isStaticRoute, landingPath, staticRoutes } from '../seo/routes'
import { externalLink } from './links'
import { Icon } from './Icon'
import { CallbackButton } from './CallbackButton'

type Section = NonNullable<SiteSeo['sections']>[number]
type LegalDetails = CompanySetting['legalDetails'] | null
type Catalog = Awaited<ReturnType<typeof getServiceCatalog>>
const visible = <T extends { visible?: boolean | null }>(rows?: T[] | null) => (rows ?? []).filter(row => row.visible !== false)
const publishedPath = (value: unknown) => {
  const page = record(value)
  return page?._status === 'published' ? landingPath(page.slug) : null
}
const converters: JSXConvertersFunction = ({ defaultConverters }) => {
  const link: NonNullable<typeof defaultConverters.link> = ({ node, nodesToJSX }) => {
    const fields = node.fields
    const url = fields.linkType === 'internal' ? publishedPath(fields.doc?.value)
      : isStaticRoute(fields.url ?? '') ? fields.url : externalLink(fields.url)
    const children = nodesToJSX({ nodes: node.children })
    return url ? <a href={url} target={fields.newTab ? '_blank' : undefined} rel={fields.newTab ? 'noopener noreferrer' : undefined}>{children}</a> : <>{children}</>
  }
  // Use only the node types offered by this editor, including for imported content.
  return { paragraph: defaultConverters.paragraph, text: defaultConverters.text, linebreak: defaultConverters.linebreak,
    list: defaultConverters.list, listitem: defaultConverters.listitem, link,
    autolink: args => link({ ...args, node: { ...args.node, type: 'link' } }) }
}

function Photo({ asset, alt, className, sizes, priority = false }: {
  asset?: number | Media | null; alt?: string | null; className?: string; sizes: string; priority?: boolean
}) {
  if (!asset || typeof asset !== 'object') return null
  const image = media(asset)
  if (!image) return null
  const position = `${asset.focalX ?? 50}% ${asset.focalY ?? 50}%`
  return <img className={className} src={image.src ?? image.url} srcSet={image.srcSet} sizes={sizes}
    width={asset.width || 900} height={asset.height || 600} style={{ objectPosition: position }}
    alt={asset.decorative ? '' : alt?.trim() ?? image.alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} />
}

function phoneURL(phone: string) {
  const number = phone.replace(/[\s()\-]/g, '')
  return phone !== DEFAULT_COMPANY_SETTINGS.phone && /^\+?\d{7,15}$/.test(number) ? 'tel:' + number : null
}

function Hero({ block, phone, first }: { block: Extract<Section, { blockType: 'hero' }>; phone: string; first: boolean }) {
  const { eyebrow, title, subtitle, description, action, button, note, image } = block
  const href = action === 'phone' ? phoneURL(phone) : action === 'section' && block.sectionPath && isStaticRoute(block.sectionPath)
    ? block.sectionPath : action === 'page' ? publishedPath(block.page) : action === 'external' ? externalLink(block.url) : null
  const buttonLabel = button?.trim()
  const hasPhoto = !!media(image)
  if (!(eyebrow?.trim() || title?.trim() || subtitle?.trim() || description?.trim() || note?.trim() || hasPhoto || (buttonLabel && (href || action === 'callback')))) return null
  return <section className={'about-hero' + (hasPhoto ? ' with-photo' : '')}>
    <div className="about-hero-copy">{eyebrow?.trim() && <span className="about-eyebrow">{eyebrow}</span>}
      {title?.trim() && <h1>{title}</h1>}{subtitle?.trim() && <p className="about-subtitle">{subtitle}</p>}
      {description?.trim() && <p>{description}</p>}
      {buttonLabel && (action === 'callback' ? <CallbackButton label={buttonLabel} /> : href && <a className="btn" href={href}>{buttonLabel}</a>)}
      {note?.trim() && <small>{note}</small>}
    </div>
    {hasPhoto && <Photo asset={image} alt={block.alt} className="about-hero-photo" sizes="(max-width: 700px) 100vw, 46vw" priority={first} />}
  </section>
}

function SectionBody({ title, children, className = '' }: { title?: string | null; children: ReactNode; className?: string }) {
  return <section className={'about-section ' + className}>{title?.trim() && <h2>{title}</h2>}{children}</section>
}

const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC' }).format(new Date(value)) : null

function Legal({ block, details }: { block: Extract<Section, { blockType: 'legal' }>; details?: LegalDetails }) {
  const facts = details?.confirmed ? [
    ['Юридическое наименование', details.legalName], ['Коммерческое наименование', details.tradeName],
    ['ИНН', details.inn], ['ОГРНИП', details.ogrnip], ['Дата регистрации', date(details.registered)],
    ['Адрес для корреспонденции', details.address], ['Дополнительная информация', details.details],
  ].filter(([, value]) => value?.trim()) : []
  const files = visible(block.items).flatMap(({ file }) => file && typeof file === 'object' && file.approved && file.url && file.title?.trim() ? [file] : [])
  if (!facts.length && !files.length) return null
  return <SectionBody title={block.title}>{block.description?.trim() && <p>{block.description}</p>}
    {!!facts.length && <dl className="about-facts">{facts.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}
    {!!files.length && <ul className="about-docs">{files.map(file => <li key={file.id}><Icon name="FileText" /><div>
      <a href={file.url!}>{file.title}</a> <small>PDF{file.filesize ? ' · ' + Math.ceil(file.filesize / 1024) + ' КБ' : ''}{file.date && ' · ' + date(file.date)}</small>
      {file.description && <p>{file.description}</p>}</div></li>)}</ul>}
  </SectionBody>
}

function Cards({ title, cards, className = '' }: { title?: string | null; cards: ReactNode[]; className?: string }) {
  return cards.length ? <SectionBody title={title}><div className={'about-grid ' + className}>{cards}</div></SectionBody> : null
}

export function AboutSections({ sections, company, catalog, details }: {
  sections: SiteSeo['sections']; company: CMSCompanySettings; catalog: Catalog; details?: LegalDetails
}) {
  const blocks = visible(sections)
  const services = new Map(catalog.services.data.map(service => [service.id, service]))
  const hasHeading = blocks.some(block => block.blockType === 'hero' && block.title?.trim())
  return <>{!hasHeading && <h1>{staticRoutes['/about']}</h1>}
    {blocks.map((block, index) => {
      const key = block.id || block.blockType
      switch (block.blockType) {
        case 'hero': return <Hero key={key} block={block} phone={company.phone} first={index === 0} />
        case 'intro': {
          const hasText = !!inspectContent(block.body).text
          const hasImage = !!media(block.image)
          return (hasText || hasImage) && <SectionBody key={key} title={block.title}><div className={'about-intro' + (hasImage && hasText ? ' split ' + block.side : '')}>
            {hasText && block.body && <RichText data={block.body} converters={converters} />}
            {hasImage && <Photo asset={block.image} alt={block.alt} sizes="(max-width: 700px) 100vw, 40vw" />}
          </div></SectionBody>
        }
        case 'benefits': return <Cards key={key} title={block.title} cards={visible(block.items).filter(row => row.title?.trim()).map(row =>
          <article key={row.id} className="about-card">{row.iconType === 'image'
            ? <Photo asset={row.image} alt="" className="about-symbol" sizes="32px" /> : <Icon name={row.icon} />}
            <h3>{row.title}</h3>{row.description && <p>{row.description}</p>}</article>)} />
        case 'competencies': return <Cards key={key} title={block.title} cards={visible(block.items).flatMap(row => {
          const service = services.get(relationshipID(row.service) ?? '')
          if (!service) return []
          const href = catalog.serviceLinks.get(service.id)
          const title = row.title?.trim() || service.title
          const description = row.description?.trim() || service.summary
          return [<article key={row.id} className="about-card">
            {media(row.image) ? <Photo asset={row.image} alt={row.alt} className="about-card-photo" sizes="(max-width:700px) 100vw, 33vw" /> : <Icon name={row.icon} />}
            <h3>{href ? <a href={href}>{title}</a> : title}</h3>{description && <p>{description}</p>}</article>]
        })} />
        case 'steps': {
          const items = visible(block.items).filter(row => row.title?.trim())
          return !!items.length && <SectionBody key={key} title={block.title}><ol className="about-steps">{items.map(row =>
            <li key={row.id}><Icon name={row.icon} /><h3>{row.title}</h3>{row.description && <p>{row.description}</p>}</li>)}</ol></SectionBody>
        }
        case 'team': return <Cards key={key} title={block.title} className="team" cards={visible(block.items).flatMap(row => {
          const name = [row.lastName, row.firstName, row.middleName].filter(part => part?.trim()).join(' ')
          if (!name && !row.role?.trim()) return []
          return [<article className="about-card" key={row.id}>{media(row.image) && <figure><Photo asset={row.image} alt={row.alt}
            sizes="(max-width:700px) 100vw, 25vw" />{row.illustrative && <figcaption>Иллюстративное изображение</figcaption>}</figure>}
            <h3>{name || row.role}</h3>{name && row.role && <strong>{row.role}</strong>}
            {row.description && <p>{row.description}</p>}{row.details && <p>{row.details}</p>}</article>]
        })} />
        case 'legal': return <Legal key={key} block={block} details={details} />
        case 'contact': {
          const tel = phoneURL(company.phone)
          const hours = block.showHours ? company.workingHours : ''
          if (![block.title, block.description, block.note, block.callback, tel && block.call, hours].some(v => v?.trim())) return null
          return <SectionBody key={key} title={block.title} className="about-contact">
            {block.description && <p>{block.description}</p>}
            {((tel && block.call) || block.callback) && <div className="about-actions">{tel && block.call && <a className="btn" href={tel}>{block.call}</a>}
              {block.callback && <CallbackButton label={block.callback} secondary />}</div>}
            {block.note && <small>{block.note}</small>}{hours && <small>{hours}</small>}
          </SectionBody>
        }
      }
    })}
  </>
}
