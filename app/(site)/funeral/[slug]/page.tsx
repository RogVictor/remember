import { notFound } from 'next/navigation'
import SiteApp from '@/SiteApp'
import { CallbackForm } from '@/CallbackForm'
import {
  offerIndex,
  offerPath,
  previewOffer,
  publishedOffer,
} from '@/funeral/data'
import { displayPrice, formats } from '@/funeral/model'
import { Items, Photo, Info, Questions } from '@/funeral/Presentation'
import { getServiceCatalog, getCompanySettings } from '@/lib/cms'
import { metadata } from '@/seo/metadata'
import { indexingEnabled, siteOrigin } from '@/seo/config'
import { JsonLd } from '@/seo/JsonLd'
import '@/funeral/funeral.css'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}
export const dynamic = 'force-dynamic'
async function current(props: Props) {
  const [{ slug }, query] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  return query.preview === '1' ? previewOffer(slug) : publishedOffer(slug)
}
export async function generateMetadata(props: Props) {
  const o = await current(props)
  if (!o) return { robots: { index: false, follow: false } }
  const image =
    o.ogImage && typeof o.ogImage === 'object'
      ? o.ogImage
      : typeof o.cover === 'object'
        ? o.cover
        : null
  return metadata({
    origin: siteOrigin(),
    path: offerPath(o),
    title: o.title,
    companyName: 'RitualGroup24',
    description: o.summary,
    fields: {
      seoTitle: o.seoTitle,
      seoDescription: o.seoDescription,
      openGraph: { title: o.ogTitle, description: o.ogDescription, image },
    },
    indexing: indexingEnabled() && (await props.searchParams).preview !== '1',
  })
}
export default async function Page(props: Props) {
  const o = await current(props)
  if (!o) notFound()
  const [catalog, company, all] = await Promise.all([
    getServiceCatalog(),
    getCompanySettings(),
    offerIndex(),
  ])
  const preview = (await props.searchParams).preview === '1'
  const path = offerPath(o)
  const breadcrumbs = [
    { title: 'Организация похорон', path: '/funeral?format=' + o.format },
  ]
  const others = all.filter(
    (other) => other.id !== o.id && other.format === o.format,
  )
  const price = displayPrice(o)
  return (
    <SiteApp page="funeral" cmsTitle={o.title} breadcrumbs={breadcrumbs}>
      <div className="funeral-body">
        <JsonLd
          origin={siteOrigin()}
          path={path}
          title={o.title}
          company={company}
          description={o.summary}
          type="Service"
          breadcrumbs={breadcrumbs}
          fixedPrice={o.priceType === 'fixed' ? o.amount : null}
          faqs={o.faq?.flatMap((q) =>
            q.answer ? [{ question: q.question, answer: q.answer }] : [],
          )}
        />
        <div className="funeral-hero">
          <div>
            {preview && <strong>Предварительный просмотр</strong>}
            <p>
              {typeof o.category === 'object' && o.category?.title} ·{' '}
              {formats[o.format]}
            </p>
            <p className="lead">{o.summary}</p>
            <strong className="funeral-price">{price}</strong>
            {o.priceDate && (
              <small>
                Цена актуализирована{' '}
                {new Date(o.priceDate).toLocaleDateString('ru-RU', {
                  timeZone: 'Europe/Moscow',
                })}
              </small>
            )}
            {!preview && (
              <a className="btn" href="#estimate">
                Получить расчёт
              </a>
            )}
          </div>
          <Photo asset={o.cover} />
        </div>
        <Info title="О комплексе" value={o.description} />
        <Info title="Преимущества" value={o.benefits} />
        {o.gallery?.length ? (
          <section>
            <h2>Фотографии</h2>
            <div className="funeral-grid">
              {o.gallery.map((m) => (
                <Photo asset={m} key={typeof m === 'object' ? m.id : m} />
              ))}
            </div>
          </section>
        ) : null}
        {o.items?.length ? (
          <section>
            <h2>Полная комплектация</h2>
            <Items items={o.items} links={catalog.serviceLinks} />
          </section>
        ) : null}
        <Info title="Включено в стоимость" value={o.included} />
        <Info title="Что не входит" value={o.excluded} />
        <Info title="Дополнительные расходы" value={o.expenses} />
        <Info title="Изменение комплектации и условия" value={o.terms} />
        <Info title="Региональные условия" value={o.region} />
        <Questions faq={o.faq} />
        {others.length > 0 && (
          <section>
            <h2>Другие комплексы</h2>
            <div className="funeral-links">
              {others.map((other) => (
                <a href={offerPath(other)} key={other.id}>
                  {other.title}
                </a>
              ))}
            </div>
          </section>
        )}
        {!preview && (
          <CallbackForm
            id="estimate"
            source={path}
            offer={{ id: o.id, title: o.title, price }}
          />
        )}
      </div>
    </SiteApp>
  )
}
