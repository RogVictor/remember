import type { FuneralOffer, Media, Page } from '../../payload-types'
import { formats, groups, states, displayPrice, money } from './model'
import { offerPath } from './data'
import { mediaURL } from '../lib/media-url'
import { landingPath } from '../seo/routes'

type Item = NonNullable<FuneralOffer['items']>[number]
export type Links = Map<number | string, string>
export function Photo({
  asset,
  fallback,
  priority = false,
}: {
  asset?: number | Media | null
  fallback?: string
  priority?: boolean
}) {
  const pic = typeof asset === 'object' && asset ? asset : null
  const url = pic?.url ? mediaURL(pic.url, pic.updatedAt) : fallback
  return url ? (
    <img
      className="funeral-photo"
      alt={pic?.alt || ''}
      src={url}
      width={pic?.width || 960}
      height={pic?.height || 600}
      srcSet={
        pic?.sizes?.card?.url && pic.sizes.card.width && pic.width
          ? mediaURL(pic.sizes.card.url, pic.updatedAt) +
            ' ' +
            pic.sizes.card.width +
            'w, ' +
            url +
            ' ' +
            pic.width +
            'w'
          : undefined
      }
      sizes="(max-width:700px) 100vw, 48vw"
      loading={priority ? 'eager' : 'lazy'}
    />
  ) : null
}
function ItemView({ item, links }: { item: Item; links: Links }) {
  const ref = item.reference
  const doc =
    typeof ref?.value === 'object' && ref.value?._status === 'published'
      ? ref.value
      : null
  const href =
    doc &&
    (ref?.relationTo === 'products'
      ? 'isAvailable' in doc && doc.isAvailable !== false
        ? '/products#product-' + doc.id
        : undefined
      : links.get(doc.id))
  const name = item.label || doc?.title || groups[item.group]
  const alternative =
    typeof item.alternative === 'object' &&
    item.alternative?._status === 'published' &&
    item.alternative.isAvailable !== false
      ? item.alternative
      : null
  return (
    <div className="funeral-item">
      <strong>{href ? <a href={href}>{name}</a> : name}</strong> ·{' '}
      {item.quantity} {item.unit}
      <small>
        {states[item.state]}
        {item.showPrice &&
          doc?.priceType === 'fixed' &&
          doc.price != null &&
          ' · ' + money(doc.price) + ' за единицу'}
        {item.showPrice &&
          doc?.priceType === 'range' &&
          doc.priceMin != null &&
          doc.priceMax != null &&
          ' · ' + money(doc.priceMin) + ' – ' + money(doc.priceMax)}
      </small>
      {item.comment && <p>{item.comment}</p>}
      {item.limits && <p>{item.limits}</p>}
      {alternative && (
        <small>
          Альтернатива ·{' '}
          <a href={'/products#product-' + alternative.id}>
            {alternative.title}
          </a>
        </small>
      )}
    </div>
  )
}
export function Items({
  items,
  links,
}: {
  items: FuneralOffer['items']
  links: Links
}) {
  return items?.map((item, i) => (
    <ItemView key={item.id || i} item={item} links={links} />
  ))
}
export function Info({
  title,
  value,
}: {
  title: string
  value?: string | null
}) {
  return value ? (
    <section>
      <h2>{title}</h2>
      <p className="funeral-lines">{value}</p>
    </section>
  ) : null
}
export function Questions({
  faq,
  title = 'Частые вопросы',
}: {
  faq: FuneralOffer['faq']
  title?: string
}) {
  const visible = faq?.filter((q) => q.answer)
  return visible?.length ? (
    <section>
      <h2>{title}</h2>
      {visible.map((q) => (
        <details key={q.id || q.question}>
          <summary>{q.question}</summary>
          <p>{q.answer}</p>
        </details>
      ))}
    </section>
  ) : null
}
export function PageLinks({
  title,
  pages,
  fallback = [],
}: {
  title: string
  pages?: (number | Page)[] | null
  fallback?: { title: string; href: string }[]
}) {
  const links = pages?.length
    ? pages.flatMap((p) =>
        typeof p === 'object' &&
        p._status === 'published' &&
        landingPath(p.slug)
          ? [{ href: '/' + p.slug, title: p.title }]
          : [],
      )
    : fallback
  return links.length ? (
    <section>
      <h2>{title}</h2>
      <div className="funeral-links">
        {links.map((link) => (
          <a href={link.href} key={link.href}>
            {link.title}
          </a>
        ))}
      </div>
    </section>
  ) : null
}
export function OfferCard({
  offer,
  links,
}: {
  offer: FuneralOffer
  links: Links
}) {
  const path = offerPath(offer)
  return (
    <article
      className="funeral-card"
      data-category={
        typeof offer.category === 'object'
          ? offer.category?.title.toLowerCase()
          : undefined
      }
    >
      <Photo asset={offer.cover} />
      <div>
        <small>
          {typeof offer.category === 'object' && offer.category?.title} ·{' '}
          {formats[offer.format]}
        </small>
        <h3>
          <a href={path}>{offer.title}</a>
        </h3>
        {offer.accent && <small>{offer.accent}</small>}
        <p>{offer.summary}</p>
        <strong className="funeral-price">{displayPrice(offer)}</strong>
        <Items items={offer.items?.filter((i) => i.short)} links={links} />
        {offer.benefits && <p className="funeral-lines">{offer.benefits}</p>}
        {(offer.terms || offer.expenses) && (
          <details>
            <summary>Условия и расходы</summary>
            <p>{offer.terms}</p>
            <p>{offer.expenses}</p>
          </details>
        )}
        <div className="funeral-actions">
          <a className="btn" href={path + '#estimate'}>
            Получить расчёт
          </a>
          <a href={path}>Подробнее</a>
        </div>
      </div>
    </article>
  )
}
export function Comparison({
  list,
  links,
  title = 'Сравнение комплексов',
}: {
  list: FuneralOffer[]
  links: Links
  title?: string
}) {
  const rows = Object.entries(groups).filter(([key]) =>
    list.some((o) => o.items?.some((i) => i.group === key)),
  )
  return rows.length ? (
    <section>
      <h2>{title}</h2>
      <div
        className="funeral-table"
        role="region"
        aria-label={title}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Комплектация</th>
              {list.map((o) => (
                <th scope="col" key={o.id}>
                  <a href={offerPath(o)}>{o.title}</a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, title]) => (
              <tr key={key}>
                <th scope="row">{title}</th>
                {list.map((o) => {
                  const items = o.items?.filter((i) => i.group === key)
                  return (
                    <td key={o.id}>
                      {items?.length ? (
                        <Items items={items} links={links} />
                      ) : (
                        'Не указано'
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ) : null
}
