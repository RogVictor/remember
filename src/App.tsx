'use client'

import { useState } from 'react'
import type {
  CMSCompanySettings,
  CMSFAQ,
  CMSPriceItem,
  CMSProduct,
  CMSResult,
  CMSService,
} from './lib/cms-types'
import { DEFAULT_COMPANY_SETTINGS } from './lib/cms-types'

type PageKey = 'home' | 'services' | 'funeral' | 'products' | 'prices' | 'about' | 'info' | 'faq' | 'contacts' | 'legal' | 'cms'

const routes: Record<string, PageKey> = {
  '': 'home', home: 'home', services: 'services', funeral: 'funeral', products: 'products',
  prices: 'prices', about: 'about', info: 'info', faq: 'faq', contacts: 'contacts', legal: 'legal',
}

const nav = [
  ['home', 'Главная'], ['services', 'Услуги'], ['funeral', 'Организация похорон'],
  ['products', 'Ритуальные товары'], ['prices', 'Цены'], ['about', 'О компании'],
  ['info', 'Полезная информация'], ['contacts', 'Контакты'],
] as const

function go(page: PageKey) {
  const path = page === 'home' ? '/' : `/${page}`
  window.location.assign(path)
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function BrandMark({ company }: { company: CMSCompanySettings }) {
  return (
    <span className="brand-mark">
      {company.logo
        ? <img className="brand-logo" src={company.logo.url} alt={company.logo.alt || company.companyName} />
        : company.companyName.charAt(0)}
    </span>
  )
}

function Button({ children, secondary = false, onClick, type = 'button', disabled }: { children: React.ReactNode; secondary?: boolean; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button className={secondary ? 'btn btn-secondary' : 'btn'} onClick={onClick} type={type} disabled={disabled}>{children}</button>
}

function Icon({ name }: { name: 'phone' | 'clock' | 'menu' | 'close' | 'check' | 'arrow' }) {
  const paths = {
    phone: <path d="M6.6 10.8a15.8 15.8 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.56 3.6.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.56 3.56a1 1 0 0 1-.25 1.02L6.6 10.8Z" />,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="m9 18 6-6-6-6"/>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>
}

function Header({ page, company }: { page: PageKey; company: CMSCompanySettings }) {
  const [open, setOpen] = useState(false)
  return <>
    <div className="topline"><div className="container top-inner"><span>Ритуальные услуги в {company.city}</span><span className="top-hours"><Icon name="clock" /> {company.workingHours}</span></div></div>
    <header>
      <div className="container header-main">
        <button className="brand" onClick={() => go('home')} aria-label="На главную">
          <BrandMark company={company}/><span><strong>{company.companyName}</strong><small>{company.brandSlogan}</small></span>
        </button>
        <div className="brand-note">Деликатная помощь<br/>в трудный момент</div>
        <div className="header-contact"><small>Телефон для связи</small><a href={phoneHref(company.phone)}>{company.phone}</a></div>
        <Button secondary onClick={() => go('contacts')}>Заказать звонок</Button>
        <Button onClick={() => go('contacts')}>Вызвать специалиста</Button>
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Открыть меню"><Icon name={open ? 'close' : 'menu'} /></button>
      </div>
      <nav className={open ? 'nav open' : 'nav'}><div className="container nav-inner">
        {nav.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { go(key); setOpen(false) }}>{label}{['services','products','info'].includes(key)}</button>)}
      </div></nav>
    </header>
  </>
}

function Footer({ company }: { company: CMSCompanySettings }) {
  return <footer><div className="container footer-grid">
    <div><div className="footer-brand"><BrandMark company={company}/><strong>{company.companyName}</strong></div><p>Комплексная помощь в организации похорон и решении сопутствующих вопросов.</p></div>
    <div><h3>Услуги</h3><button onClick={() => go('funeral')}>Организация похорон</button><button onClick={() => go('products')}>Ритуальные товары</button><button onClick={() => go('prices')}>Цены на услуги</button></div>
    <div><h3>Информация</h3><button onClick={() => go('about')}>О компании</button><button onClick={() => go('faq')}>Частые вопросы</button><button onClick={() => go('legal')}>Политика конфиденциальности</button></div>
    <div><h3>Контакты</h3><a className="footer-phone" href={phoneHref(company.phone)}>{company.phone}</a>{company.additionalPhone && <p><a href={phoneHref(company.additionalPhone)}>{company.additionalPhone}</a></p>}<p>{company.address && <>{company.address}<br/></>}{company.workingHours}</p>{company.email && <a href={`mailto:${company.email}`}>{company.email}</a>}{company.messengerUrl && <p><a href={company.messengerUrl} target="_blank" rel="noreferrer">Написать в мессенджер</a></p>}</div>
  </div><div className="container copyright">© 2026 {company.companyName}. Информация на сайте не является публичной офертой.</div></footer>
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return <div className="section-title">{eyebrow && <span>{eyebrow}</span>}<h2>{children}</h2></div>
}

function ServiceGrid({ result, limit }: { result: CMSResult<CMSService>; limit?: number }) {
  if (result.error) return <EmptyState>Не удалось загрузить услуги. Попробуйте открыть страницу позже.</EmptyState>
  if (result.data.length === 0) return <EmptyState>Информация об услугах скоро появится.</EmptyState>

  return <div className="service-grid">{result.data.slice(0, limit).map((service) => {
    const card = <article className="service-card" key={service.id}>
      {service.image && <img className="catalog-service-image" src={service.image.url} alt={service.image.alt || service.title} />}
      {service.category && <small className="catalog-category">{service.category}</small>}
      <h3>{service.title}</h3>
      {service.summary && <p>{service.summary}</p>}
      {service.description && <p>{service.description}</p>}
      <strong className="catalog-price">{formatPrice(service)}</strong>
    </article>

    return service.linkSlug
      ? <a className="service-card-link" href={`/${service.linkSlug}`} key={service.id}>{card}</a>
      : card
  })}</div>
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="catalog-empty" role="status">{children}</p>
}

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function formatPrice(price: Pick<CMSService, 'price' | 'priceMax' | 'priceMin' | 'priceType'>): string {
  if (price.priceType === 'fixed') {
    return typeof price.price === 'number'
      ? currencyFormatter.format(price.price)
      : 'Уточняйте стоимость'
  }
  if (
    price.priceType === 'range' &&
    typeof price.priceMin === 'number' &&
    typeof price.priceMax === 'number'
  ) {
    return `от ${currencyFormatter.format(price.priceMin)} до ${currencyFormatter.format(price.priceMax)}`
  }
  return 'Уточняйте стоимость'
}

function ContactAside({ company }: { company: CMSCompanySettings }) {
  return <aside className="contact-aside"><span>Консультация · {company.workingHours}</span><a href={phoneHref(company.phone)}>{company.phone}</a><p>Специалист ответит на вопросы и поможет определить порядок действий.</p><Button onClick={() => go('contacts')}>Связаться с нами</Button></aside>
}

function Breadcrumbs({ title }: { title: string }) {
  return <div className="breadcrumbs"><button onClick={() => go('home')}>Главная</button><span>/</span><span>{title}</span></div>
}

function Home({
  company,
  services,
  priceItems,
  faqs,
}: {
  company: CMSCompanySettings
  services: CMSResult<CMSService>
  priceItems: CMSResult<CMSPriceItem>
  faqs: CMSResult<CMSFAQ>
}) {
  return <>
    <section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="hero-label">Деликатная помощь 24 часа</span><h1>Ритуальные услуги<br/>и организация похорон</h1><p>Полный комплекс ритуальных услуг. Помощь в организации похорон, оформлении документов и решении необходимых вопросов.</p><div className="hero-actions"><Button onClick={() => go('contacts')}>Вызвать специалиста</Button><Button secondary onClick={() => go('services')}>Все услуги</Button></div><a className="hero-phone" href={phoneHref(company.phone)}><Icon name="phone"/> {company.phone}</a></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1532276958900-0036587925c8?auto=format&fit=crop&w=1000&q=85" alt="Белые цветы в спокойной светлой композиции"/><span>Помощь с уважением и вниманием к каждой семье</span></div></div></section>
    <section className="section container"><SectionTitle eyebrow="Основные направления">Наши услуги</SectionTitle><ServiceGrid result={services} limit={8}/><div className="center"><Button secondary onClick={() => go('services')}>Смотреть все услуги</Button></div></section>
    <section className="advantages"><div className="container"><SectionTitle>Почему обращаются к нам</SectionTitle><div className="adv-grid">{['Круглосуточная консультация','Комплексный подход','Понятная стоимость услуг','Сопровождение на этапах'].map((x,i)=><div className="adv" key={x}><span>0{i+1}</span><h3>{x}</h3><p>{['Принимаем обращения 24 часа, без выходных.','Помогаем согласовать услуги в одном месте.','Объясняем, из чего складывается итоговая сумма.','Остаёмся на связи в согласованном порядке.'][i]}</p></div>)}</div></div></section>
    <section className="section container"><SectionTitle eyebrow="Порядок действий">Как организовать похороны</SectionTitle><div className="steps">{['Свяжитесь с нами','Обсудите необходимые услуги','Согласуйте стоимость и порядок','Получите помощь в организации'].map((x,i)=><div className="step" key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></section>
    <section className="section muted"><div className="container"><SectionTitle>Стоимость ритуальных услуг</SectionTitle><PriceTable result={priceItems} compact/><div className="center"><Button onClick={() => go('prices')}>Посмотреть все цены</Button></div></div></section>
    <section className="section container split-section"><div><SectionTitle eyebrow="Ответы специалистов">Часто задаваемые вопросы</SectionTitle><FaqList result={faqs} limit={3}/><button className="text-link faq-more" onClick={()=>go('faq')}>Все вопросы <Icon name="arrow"/></button></div><ContactAside company={company}/></section>
  </>
}

function PriceTable({ result, compact = false }: { result: CMSResult<CMSPriceItem>; compact?: boolean }) {
  if (result.error) return <EmptyState>Не удалось загрузить прайс-лист. Попробуйте открыть страницу позже.</EmptyState>
  if (result.data.length === 0) return <EmptyState>Прайс-лист пока не опубликован.</EmptyState>

  const items = compact ? result.data.slice(0, 4) : result.data
  return <div className="table-wrap"><table><thead><tr><th>Наименование услуги</th><th>Описание</th><th>Стоимость</th></tr></thead><tbody>{items.map((item) =>
    <tr key={item.id}>
      <td data-label="Услуга">
        {item.category && <small className="catalog-category">{item.category} · </small>}
        {item.linkSlug ? <a className="catalog-item-link" href={`/${item.linkSlug}`}>{item.title}</a> : item.title}
        {item.unit && <span> / {item.unit}</span>}
      </td>
      <td data-label="Описание">{item.description || '—'}</td>
      <td data-label="Стоимость">{formatPrice(item)}</td>
    </tr>
  )}</tbody></table></div>
}

function CatalogPage({
  company,
  type,
  services,
  products,
}: {
  company: CMSCompanySettings
  type: 'services' | 'products'
  services: CMSResult<CMSService>
  products: CMSResult<CMSProduct>
}) {
  return <PageShell company={company} title={type==='services'?'Ритуальные услуги':'Ритуальные принадлежности'} intro={type==='services'?'Оказываем комплексную помощь в организации похорон. Специалист подробно объяснит порядок действий и поможет выбрать только необходимые услуги.':'Каталог ритуальных принадлежностей. Наличие, комплектацию и стоимость конкретных изделий уточняйте у специалиста.'}>
    {type === 'services' ? <ServiceGrid result={services}/> : products.error
      ? <EmptyState>Не удалось загрузить каталог. Попробуйте открыть страницу позже.</EmptyState>
      : products.data.length === 0
        ? <EmptyState>В каталоге пока нет доступных товаров.</EmptyState>
        : <div className="product-grid">{products.data.map((product, index) =>
          <article className="product" key={product.id}>
            <div className="product-image">
              {product.images[0]
                ? <img src={product.images[0].url} alt={product.images[0].alt || product.title} />
                : <span>{String(index + 1).padStart(2, '0')}</span>}
            </div>
            <div>
              {product.category && <small>{product.category}</small>}
              <h3>{product.title}</h3>
              {product.summary && <p>{product.summary}</p>}
              {product.description && <p>{product.description}</p>}
              <strong>{formatPrice(product)}</strong>
              <Button secondary onClick={() => go('contacts')}>Уточнить стоимость</Button>
            </div>
          </article>
        )}</div>}
  </PageShell>
}

function PageShell({ company, title, intro, children, aside = true }: { company: CMSCompanySettings; title: string; intro?: string; children: React.ReactNode; aside?: boolean }) {
  return <main className="page container"><Breadcrumbs title={title}/><div className={aside?'page-layout':''}><div><h1>{title}</h1>{intro&&<p className="lead">{intro}</p>}{children}</div>{aside&&<ContactAside company={company}/>}</div></main>
}

function FuneralPage({ company }: { company: CMSCompanySettings }) {
  return <PageShell company={company} title="Организация похорон" intro="Помогаем последовательно решить организационные вопросы и согласовать состав необходимых услуг.">
    <img className="content-image" src="https://images.unsplash.com/photo-1777542842081-808785008a22?auto=format&fit=crop&w=1200&q=80" alt="Сдержанная композиция из белых цветов"/>
    <h2>Помощь на каждом согласованном этапе</h2><p>Организация церемонии требует внимания к документам, срокам и множеству практических деталей. Специалист уточнит обстоятельства, предложит понятный порядок действий и ответит на вопросы.</p>
    <div className="note"><strong>В комплекс услуг может входить:</strong><ul>{['Консультация по первоочередным действиям','Помощь с подготовкой необходимых документов','Подбор ритуальных принадлежностей','Организация транспорта и церемонии','Согласование дополнительных услуг'].map(x=><li key={x}><Icon name="check"/>{x}</li>)}</ul></div>
    <h2>Порядок организации</h2><div className="vertical-steps">{['Первичная консультация','Определение состава услуг','Согласование стоимости','Организационное сопровождение'].map((x,i)=><div key={x}><span>{i+1}</span><div><h3>{x}</h3><p>Содержание этапа уточняется индивидуально с учётом ситуации и пожеланий семьи.</p></div></div>)}</div>
    <h2>Стоимость</h2><p>Итоговая стоимость зависит от выбранных услуг и принадлежностей. До оформления специалист предоставит подробный перечень и ответит на вопросы.</p>
  </PageShell>
}

function FaqList({ result, limit }: { result: CMSResult<CMSFAQ>; limit?: number }) {
  const [active, setActive] = useState(0)
  if (result.error) return <EmptyState>Не удалось загрузить частые вопросы. Попробуйте открыть страницу позже.</EmptyState>
  if (result.data.length === 0) return <EmptyState>Частые вопросы скоро появятся.</EmptyState>

  return <div className="faq">{result.data.slice(0,limit).map(({ question, answer, id },i)=><div className="faq-item" key={id}><button onClick={()=>setActive(active===i?-1:i)}><span>{question}</span><b>{active===i?'−':'+'}</b></button>{active===i&&<p>{answer}</p>}</div>)}</div>
}

function InfoPage({ company }: { company: CMSCompanySettings }) {
  const articles=['Что делать в первую очередь','Какие документы могут понадобиться','Как выбрать ритуальные принадлежности','Из чего складывается стоимость похорон','Кремация: основные организационные вопросы','Как подготовиться к поминальной церемонии']
  return <PageShell company={company} title="Полезная информация" intro="Практические материалы о порядке действий, документах и организации церемонии.">
    <div className="article-list">{articles.map((x,i)=><article key={x}><span>Информация · [дата]</span><h2>{x}</h2><p>Краткие разъяснения и практические рекомендации, которые помогут сориентироваться в последовательности действий.</p><button className="text-link">Читать далее <Icon name="arrow"/></button></article>)}</div>
  </PageShell>
}

function Contacts({ company }: { company: CMSCompanySettings }) {
  return <PageShell company={company} title="Контакты" intro="Мы готовы ответить на вопросы и помочь определить дальнейший порядок действий." aside={false}>
    <div className="contacts-grid"><div className="contact-details"><div><small>Основной телефон</small><a href={phoneHref(company.phone)}>{company.phone}</a></div>{company.additionalPhone && <div><small>Дополнительный телефон</small><a href={phoneHref(company.additionalPhone)}>{company.additionalPhone}</a></div>}{company.email && <div><small>Email</small><a href={`mailto:${company.email}`}>{company.email}</a></div>}{company.address && <div><small>Адрес</small><strong>{company.address}</strong></div>}<div><small>Режим работы</small><strong>{company.workingHours}</strong></div>{company.messengerUrl && <div><small>Мессенджер</small><a href={company.messengerUrl} target="_blank" rel="noreferrer">Написать нам</a></div>}<div className="map">Место для карты</div></div><CallbackForm/></div>
  </PageShell>
}

function CallbackForm() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      if (!response.ok) throw new Error('Lead submission failed')
      setSent(true)
      form.reset()
    } catch {
      setError('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  return <form className="callback" onSubmit={submitLead}>
    <span>Обратная связь</span><h2>Заказать звонок</h2>
    <p>Оставьте номер — специалист свяжется с вами для консультации.</p>
    <label>Ваше имя<input name="name" required maxLength={120} placeholder="Как к вам обращаться"/></label>
    <label>Телефон<input name="phone" type="tel" required maxLength={40} placeholder="+7 (___) ___-__-__"/></label>
    <div className="lead-honeypot" aria-hidden="true">
      <label>Оставьте это поле пустым<input name="website" tabIndex={-1} autoComplete="off"/></label>
    </div>
    <input type="hidden" name="requestType" value="callback"/>
    <input type="hidden" name="source" value="/contacts#callback"/>
    <label className="consent"><input type="checkbox" name="personalDataConsent" value="true" required/> <span>Согласен на обработку персональных данных</span></label>
    <Button type="submit" disabled={submitting || sent}>
      {submitting ? 'Отправка…' : sent ? 'Заявка отправлена' : 'Заказать звонок'}
    </Button>
    {sent && <p className="success" role="status">Спасибо! Заявка сохранена, специалист свяжется с вами.</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </form>
}

function About({ company }: { company: CMSCompanySettings }) {
  return <PageShell company={company} title="О компании" intro={`${company.companyName} помогает семьям решать организационные вопросы спокойно, последовательно и с уважением.`}>
    <div className="editorial"><h2>Наш подход к работе</h2><p>Мы считаем важными деликатное общение, понятное объяснение каждого этапа и прозрачное согласование состава услуг. Фактические сведения о компании, реквизиты и документы будут добавлены после подтверждения.</p><div className="principles">{['Уважительное отношение','Понятный порядок действий','Согласование стоимости','Круглосуточная связь'].map((x,i)=><div key={x}><span>0{i+1}</span><h3>{x}</h3></div>)}</div><h2>В каких вопросах мы помогаем</h2><p>Организация похорон, подбор принадлежностей, транспорт, консультации по документам, кремация, памятники и поминальные мероприятия.</p></div>
  </PageShell>
}

export default function App({
  company = DEFAULT_COMPANY_SETTINGS,
  page = 'home',
  services = { data: [], error: false },
  products = { data: [], error: false },
  priceItems = { data: [], error: false },
  faqs = { data: [], error: false },
  cmsTitle,
  children,
}: {
  company?: CMSCompanySettings
  page?: PageKey
  services?: CMSResult<CMSService>
  products?: CMSResult<CMSProduct>
  priceItems?: CMSResult<CMSPriceItem>
  faqs?: CMSResult<CMSFAQ>
  cmsTitle?: string
  children?: React.ReactNode
}) {
  let content: React.ReactNode
  if(page==='home') content=<Home company={company} services={services} priceItems={priceItems} faqs={faqs}/>
  else if(page==='services') content=<CatalogPage company={company} type="services" services={services} products={products}/>
  else if(page==='products') content=<CatalogPage company={company} type="products" services={services} products={products}/>
  else if(page==='funeral') content=<FuneralPage company={company}/>
  else if(page==='prices') content=<PageShell company={company} title="Цены на ритуальные услуги" intro="Актуальные позиции и стоимость услуг из нашего прайс-листа."><PriceTable result={priceItems}/><div className="note price-note"><strong>Обратите внимание</strong><p>Итоговая сумма зависит от выбранного состава услуг, принадлежностей и индивидуальных условий. Точную стоимость специалист согласует до оформления.</p></div></PageShell>
  else if(page==='about') content=<About company={company}/>
  else if(page==='info') content=<InfoPage company={company}/>
  else if(page==='faq') content=<PageShell company={company} title="Часто задаваемые вопросы" intro="Ответы на основные вопросы об организации похорон и работе службы."><FaqList result={faqs}/></PageShell>
  else if(page==='contacts') content=<Contacts company={company}/>
  else if(page==='legal') content=<PageShell company={company} title="Политика конфиденциальности" intro="Шаблон документа для последующего заполнения юридически проверенными сведениями." aside={false}><div className="legal"><h2>Общие положения</h2><p>[Разместите утверждённый текст политики обработки персональных данных.]</p><h2>Согласие на обработку данных</h2><p>[Разместите утверждённый текст согласия и реквизиты оператора.]</p></div></PageShell>
  else content=<PageShell company={company} title={cmsTitle || ''}><article className="editorial cms-page">{children}</article></PageShell>
  return <><Header page={page} company={company}/>{content}<Footer company={company}/></>
}
