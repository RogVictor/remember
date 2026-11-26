import { Fragment } from 'react'
import Link from 'next/link'
import SiteApp from '@/SiteApp'
import { staticMetadata, staticSeoInput } from '@/seo/public'
import { CallbackForm } from '@/CallbackForm'
import { getCompanySettings, getServiceCatalog } from '@/lib/cms'
import { JsonLd } from '@/seo/JsonLd'
import { offers, settings } from '@/funeral/data'
import {
  Comparison,
  OfferCard,
  Info,
  Photo,
  Questions,
  PageLinks,
} from '@/funeral/Presentation'
import {
  funeralTitle,
  funeralIntro,
  funeralSteps,
  formats,
  sections,
} from '@/funeral/model'
import '@/funeral/funeral.css'

export const dynamic = 'force-dynamic'
export const generateMetadata = staticMetadata('/funeral')
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>
}) {
  const params = await searchParams
  const format = params.format === 'cremation' ? 'cremation' : 'burial'
  const [list, s, company, catalog, seo] = await Promise.all([
    offers({ format }),
    settings(),
    getCompanySettings(),
    getServiceCatalog(),
    staticSeoInput('/funeral'),
  ])
  const title = s.heading || funeralTitle
  const intro = s.intro || funeralIntro
  const catalogPages = (slugs: string[]) =>
    catalog.services.data.flatMap((service) => {
      const href = catalog.serviceLinks.get(service.id)
      return href && slugs.includes(href.slice(1))
        ? [{ title: service.title, href }]
        : []
    })
  const defaults = [
    'vyzov-ritualnogo-agenta',
    'oformlenie-dokumentov-dlya-pohoron',
    'uslugi-morga',
    'podgotovka-tela-k-pogrebeniyu',
    'ritualnyi-transport',
    'organizaciya-proshchaniya',
    'organizaciya-zahoroneniya',
    'organizaciya-kremacii',
    'pominki',
  ]
  const faq = s.faq?.flatMap((q) =>
    q.answer ? [{ question: q.question, answer: q.answer }] : [],
  )
  const defaultLayout = Object.keys(sections).map((key) => ({
    key: key as keyof typeof sections,
    heading: '',
    visible: true,
  }))
  const layout = (s.sections?.length ? s.sections : defaultLayout).filter(
    (row) => row.visible !== false,
  )
  const has = (key: string) => layout.some((row) => row.key === key)
  const render = {
    offers: (heading: string) => (
      <section id="offers">
        <h2>{heading}</h2>
        <nav className="funeral-switch" aria-label="Формат похорон">
          {Object.entries(formats).map(([key, label]) => (
            <a
              key={key}
              aria-current={format === key ? 'page' : undefined}
              href={'/funeral?format=' + key + '#offers'}
            >
              {label}
            </a>
          ))}
        </nav>
        {list.length ? (
          <div className="funeral-grid">
            {list.map((o) => (
              <OfferCard key={o.id} offer={o} links={catalog.serviceLinks} />
            ))}
          </div>
        ) : (
          <div className="note">
            <strong>Индивидуальный подбор услуг · {formats[format]}</strong>
            <p>
              Итоговая стоимость зависит от выбранных услуг и принадлежностей.
              Специалист уточнит пожелания семьи и согласует перечень и расходы
              до оформления.
            </p>
            <a href={has('callback') ? '#callback' : '/contacts#callback'}>
              Обсудить состав услуг
            </a>
          </div>
        )}
      </section>
    ),
    comparison: (heading: string) => (
      <Comparison title={heading} list={list} links={catalog.serviceLinks} />
    ),
    directions: (heading: string) => (
      <PageLinks
        title={heading}
        pages={s.directions}
        fallback={[
          ...catalogPages(defaults),
          { title: 'Ритуальные принадлежности', href: '/products' },
        ]}
      />
    ),
    extras: (heading: string) => (
      <PageLinks
        title={heading}
        pages={s.extras}
        fallback={catalogPages([
          'dopolnitelnye-uslugi',
          'traurnyi-orkestr',
          'transport-dlya-rodstvennikov',
        ])}
      />
    ),
    programs: (heading: string) => (
      <PageLinks
        title={heading}
        pages={s.programs}
        fallback={catalogPages([
          'socialnye-pohorony',
          'voennye-pohorony',
          'prizhiznennyi-dogovor',
        ])}
      />
    ),
    steps: (heading: string) => (
      <section>
        <h2>{heading}</h2>
        <div className="vertical-steps">
          {(
            s.steps ?? funeralSteps.map((title) => ({ title, description: '' }))
          ).map((step, i) => (
            <div key={i}>
              <span>{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                {step.description && <p>{step.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    documents: (heading: string) => (
      <section>
        <h2>{heading}</h2>
        {s.documents && <p>{s.documents}</p>}
        <Link href="/chto-delat-esli-umer-chelovek">
          Порядок действий и документы
        </Link>
      </section>
    ),
    advantages: (heading: string) => (
      <Info
        title={heading}
        value={
          s.advantages ??
          'Специалист уточнит обстоятельства, предложит порядок действий и ответит на вопросы семьи.'
        }
      />
    ),
    geography: (heading: string) => (
      <Info title={heading} value={s.geography ?? company.city} />
    ),
    articles: (heading: string) => (
      <PageLinks
        title={heading}
        pages={s.articles}
        fallback={[
          { title: 'Справочные материалы', href: '/info' },
          { title: 'Частые вопросы', href: '/faq' },
        ]}
      />
    ),
    faq: (heading: string) => <Questions title={heading} faq={s.faq} />,
    callback: (heading: string) => (
      <CallbackForm
        heading={heading}
        id="callback"
        source={'/funeral?format=' + format}
      />
    ),
  }
  return (
    <SiteApp page="funeral" cmsTitle={title}>
      <div className="funeral-body">
        <JsonLd
          origin={seo.origin}
          path="/funeral"
          title={title}
          description={intro}
          company={company}
          type="Service"
          faqs={has('faq') ? faq : undefined}
        />
        <div className="funeral-hero">
          <div>
            <p className="lead">{intro}</p>
            <ul>
              {(
                s.benefits ??
                'Подбор ритуальных принадлежностей\nСогласование услуг и стоимости\nОрганизационное сопровождение'
              )
                .split('\n')
                .filter(Boolean)
                .map((b) => (
                  <li key={b}>{b}</li>
                ))}
            </ul>
            <div className="funeral-actions">
              <a className="btn" href={has('offers') ? '#offers' : '/services'}>
                {s.chooseLabel || 'Выбрать комплекс'}
              </a>
              <a
                className="btn btn-secondary"
                href={has('callback') ? '#callback' : '/contacts#callback'}
              >
                {s.consultLabel || 'Получить консультацию'}
              </a>
            </div>
            <a
              className="hero-phone"
              href={'tel:' + company.phone.replace(/[^+\d]/g, '')}
            >
              {company.phone}
            </a>
          </div>
          <Photo asset={s.hero} fallback="/funeral.webp" priority />
        </div>
        <Link className="funeral-guide" href="/chto-delat-esli-umer-chelovek">
          Что делать, если умер человек? <span aria-hidden="true">→</span>
        </Link>
        {layout.map((row) => (
          <Fragment key={row.key}>
            {render[row.key](row.heading || sections[row.key])}
          </Fragment>
        ))}
      </div>
    </SiteApp>
  )
}
