'use client'

import { useState } from 'react'

type PageKey = 'home' | 'services' | 'funeral' | 'products' | 'prices' | 'about' | 'info' | 'faq' | 'contacts' | 'legal'

const routes: Record<string, PageKey> = {
  '': 'home', home: 'home', services: 'services', funeral: 'funeral', products: 'products',
  prices: 'prices', about: 'about', info: 'info', faq: 'faq', contacts: 'contacts', legal: 'legal',
}

const nav = [
  ['home', 'Главная'], ['services', 'Услуги'], ['funeral', 'Организация похорон'],
  ['products', 'Ритуальные товары'], ['prices', 'Цены'], ['about', 'О компании'],
  ['info', 'Полезная информация'], ['contacts', 'Контакты'],
] as const

const serviceItems = [
  ['Организация похорон', 'Помощь в согласовании порядка церемонии и необходимых услуг.', 'funeral', '01'],
  ['Оформление документов', 'Консультация по перечню документов и последовательности действий.', 'services', '02'],
  ['Ритуальные принадлежности', 'Гробы, текстиль, кресты и другие необходимые принадлежности.', 'products', '03'],
  ['Венки и композиции', 'Траурные венки и композиции с возможностью уточнить оформление.', 'products', '04'],
  ['Кремация', 'Организационное сопровождение и разъяснение порядка проведения.', 'services', '05'],
  ['Перевозка умерших', 'Специализированный транспорт и согласование маршрута перевозки.', 'services', '06'],
  ['Памятники и благоустройство', 'Подбор мемориальной продукции и работ по уходу за захоронением.', 'services', '07'],
  ['Поминальные мероприятия', 'Помощь в подборе места и организации поминальной трапезы.', 'services', '08'],
] as const

function go(page: PageKey) {
  const path = page === 'home' ? '/' : `/${page}`
  window.location.assign(path)
}

function Button({ children, secondary = false, onClick }: { children: React.ReactNode; secondary?: boolean; onClick?: () => void }) {
  return <button className={secondary ? 'btn btn-secondary' : 'btn'} onClick={onClick}>{children}</button>
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

function Header({ page }: { page: PageKey }) {
  const [open, setOpen] = useState(false)
  return <>
    <div className="topline"><div className="container top-inner"><span>Ритуальные услуги в Москве</span><span className="top-hours"><Icon name="clock" /> Работаем круглосуточно</span></div></div>
    <header>
      <div className="container header-main">
        <button className="brand" onClick={() => go('home')} aria-label="На главную">
          <span className="brand-mark">П</span><span><strong>ПАМЯТЬ</strong><small>Ритуальная служба</small></span>
        </button>
        <div className="brand-note">Деликатная помощь<br/>в трудный момент</div>
        <div className="header-contact"><small>Круглосуточная линия</small><a href="tel:+70000000000">+7 (000) 000-00-00</a></div>
        <Button secondary onClick={() => go('contacts')}>Заказать звонок</Button>
        <Button onClick={() => go('contacts')}>Вызвать специалиста</Button>
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Открыть меню"><Icon name={open ? 'close' : 'menu'} /></button>
      </div>
      <nav className={open ? 'nav open' : 'nav'}><div className="container nav-inner">
        {nav.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { go(key); setOpen(false) }}>{label}{['services','products','info'].includes(key) && <span className="chev">⌄</span>}</button>)}
      </div></nav>
    </header>
  </>
}

function Footer() {
  return <footer><div className="container footer-grid">
    <div><div className="footer-brand"><span className="brand-mark">П</span><strong>ПАМЯТЬ</strong></div><p>Комплексная помощь в организации похорон и решении сопутствующих вопросов.</p></div>
    <div><h3>Услуги</h3><button onClick={() => go('funeral')}>Организация похорон</button><button onClick={() => go('products')}>Ритуальные товары</button><button onClick={() => go('prices')}>Цены на услуги</button></div>
    <div><h3>Информация</h3><button onClick={() => go('about')}>О компании</button><button onClick={() => go('faq')}>Частые вопросы</button><button onClick={() => go('legal')}>Политика конфиденциальности</button></div>
    <div><h3>Контакты</h3><a className="footer-phone" href="tel:+70000000000">+7 (000) 000-00-00</a><p>Адрес офиса уточняется<br/>Круглосуточно, без выходных</p></div>
  </div><div className="container copyright">© 2026 Ритуальная служба «Память». Информация на сайте не является публичной офертой.</div></footer>
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return <div className="section-title">{eyebrow && <span>{eyebrow}</span>}<h2>{children}</h2></div>
}

function ServiceGrid({ limit }: { limit?: number }) {
  return <div className="service-grid">{serviceItems.slice(0, limit).map(([title, text, route, num]) =>
    <article className="service-card" key={title}><span className="service-num">{num}</span><h3>{title}</h3><p>{text}</p><button className="text-link" onClick={() => go(route)}>{'Подробнее'} <Icon name="arrow" /></button></article>
  )}</div>
}

function ContactAside() {
  return <aside className="contact-aside"><span>Круглосуточная консультация</span><a href="tel:+70000000000">+7 (000) 000-00-00</a><p>Специалист ответит на вопросы и поможет определить порядок действий.</p><Button onClick={() => go('contacts')}>Связаться с нами</Button></aside>
}

function Breadcrumbs({ title }: { title: string }) {
  return <div className="breadcrumbs"><button onClick={() => go('home')}>Главная</button><span>/</span><span>{title}</span></div>
}

function Home() {
  return <>
    <section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="hero-label">Деликатная помощь 24 часа</span><h1>Ритуальные услуги<br/>и организация похорон</h1><p>Полный комплекс ритуальных услуг. Помощь в организации похорон, оформлении документов и решении необходимых вопросов.</p><div className="hero-actions"><Button onClick={() => go('contacts')}>Вызвать специалиста</Button><Button secondary onClick={() => go('services')}>Все услуги</Button></div><a className="hero-phone" href="tel:+70000000000"><Icon name="phone"/> +7 (000) 000-00-00</a></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1532276958900-0036587925c8?auto=format&fit=crop&w=1000&q=85" alt="Белые цветы в спокойной светлой композиции"/><span>Помощь с уважением и вниманием к каждой семье</span></div></div></section>
    <section className="section container"><SectionTitle eyebrow="Основные направления">Наши услуги</SectionTitle><ServiceGrid limit={8}/><div className="center"><Button secondary onClick={() => go('services')}>Смотреть все услуги</Button></div></section>
    <section className="advantages"><div className="container"><SectionTitle>Почему обращаются к нам</SectionTitle><div className="adv-grid">{['Круглосуточная консультация','Комплексный подход','Понятная стоимость услуг','Сопровождение на этапах'].map((x,i)=><div className="adv" key={x}><span>0{i+1}</span><h3>{x}</h3><p>{['Принимаем обращения 24 часа, без выходных.','Помогаем согласовать услуги в одном месте.','Объясняем, из чего складывается итоговая сумма.','Остаёмся на связи в согласованном порядке.'][i]}</p></div>)}</div></div></section>
    <section className="section container"><SectionTitle eyebrow="Порядок действий">Как организовать похороны</SectionTitle><div className="steps">{['Свяжитесь с нами','Обсудите необходимые услуги','Согласуйте стоимость и порядок','Получите помощь в организации'].map((x,i)=><div className="step" key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></section>
    <section className="section muted"><div className="container"><SectionTitle>Стоимость ритуальных услуг</SectionTitle><PriceTable compact/><div className="center"><Button onClick={() => go('prices')}>Посмотреть все цены</Button></div></div></section>
    <section className="section container split-section"><div><SectionTitle eyebrow="Ответы специалистов">Часто задаваемые вопросы</SectionTitle><FaqList limit={3}/><button className="text-link faq-more" onClick={()=>go('faq')}>Все вопросы <Icon name="arrow"/></button></div><ContactAside/></section>
  </>
}

const prices = [
  ['Организация похорон', 'Состав услуг определяется после консультации', 'от [сумма] ₽'],
  ['Транспортные услуги', 'По согласованному маршруту', 'от [сумма] ₽'],
  ['Ритуальные принадлежности', 'В зависимости от выбранной комплектации', 'от [сумма] ₽'],
  ['Венки и композиции', 'Размер и состав уточняются при заказе', 'от [сумма] ₽'],
  ['Кремация', 'Организационное сопровождение', 'от [сумма] ₽'],
  ['Дополнительные услуги', 'По индивидуальному перечню', 'по запросу'],
]

function PriceTable({ compact = false }: { compact?: boolean }) {
  return <div className="table-wrap"><table><thead><tr><th>Наименование услуги</th><th>Описание</th><th>Стоимость</th></tr></thead><tbody>{prices.slice(0,compact?4:6).map(r=><tr key={r[0]}>{r.map((c,i)=><td key={c} data-label={['Услуга','Описание','Стоимость'][i]}>{c}</td>)}</tr>)}</tbody></table></div>
}

function CatalogPage({ type }: { type: 'services' | 'products' }) {
  const products = ['Гробы','Венки','Траурные композиции','Кресты','Текстиль и принадлежности','Урны для праха']
  return <PageShell title={type==='services'?'Ритуальные услуги':'Ритуальные принадлежности'} intro={type==='services'?'Оказываем комплексную помощь в организации похорон. Специалист подробно объяснит порядок действий и поможет выбрать только необходимые услуги.':'Каталог ритуальных принадлежностей. Наличие, комплектацию и стоимость конкретных изделий уточняйте у специалиста.'}>
    {type==='services'?<ServiceGrid/>:<div className="product-grid">{products.map((p,i)=><article className="product" key={p}><div className="product-image"><span>{String(i+1).padStart(2,'0')}</span></div><div><small>Категория товаров</small><h3>{p}</h3><p>Варианты исполнения и материалы представлены в каталоге.</p><strong>от [сумма] ₽</strong><Button secondary onClick={()=>go('contacts')}>Уточнить стоимость</Button></div></article>)}</div>}
  </PageShell>
}

function PageShell({ title, intro, children, aside = true }: { title: string; intro?: string; children: React.ReactNode; aside?: boolean }) {
  return <main className="page container"><Breadcrumbs title={title}/><div className={aside?'page-layout':''}><div><h1>{title}</h1>{intro&&<p className="lead">{intro}</p>}{children}</div>{aside&&<ContactAside/>}</div></main>
}

function FuneralPage() {
  return <PageShell title="Организация похорон" intro="Помогаем последовательно решить организационные вопросы и согласовать состав необходимых услуг.">
    <img className="content-image" src="https://images.unsplash.com/photo-1777542842081-808785008a22?auto=format&fit=crop&w=1200&q=80" alt="Сдержанная композиция из белых цветов"/>
    <h2>Помощь на каждом согласованном этапе</h2><p>Организация церемонии требует внимания к документам, срокам и множеству практических деталей. Специалист уточнит обстоятельства, предложит понятный порядок действий и ответит на вопросы.</p>
    <div className="note"><strong>В комплекс услуг может входить:</strong><ul>{['Консультация по первоочередным действиям','Помощь с подготовкой необходимых документов','Подбор ритуальных принадлежностей','Организация транспорта и церемонии','Согласование дополнительных услуг'].map(x=><li key={x}><Icon name="check"/>{x}</li>)}</ul></div>
    <h2>Порядок организации</h2><div className="vertical-steps">{['Первичная консультация','Определение состава услуг','Согласование стоимости','Организационное сопровождение'].map((x,i)=><div key={x}><span>{i+1}</span><div><h3>{x}</h3><p>Содержание этапа уточняется индивидуально с учётом ситуации и пожеланий семьи.</p></div></div>)}</div>
    <h2>Стоимость</h2><p>Итоговая стоимость зависит от выбранных услуг и принадлежностей. До оформления специалист предоставит подробный перечень и ответит на вопросы.</p>
  </PageShell>
}

const questions = [
  ['Что делать в первую очередь?', 'Свяжитесь с круглосуточной службой. Специалист спокойно уточнит обстоятельства и объяснит последовательность дальнейших действий.'],
  ['Какие документы могут понадобиться?', 'Перечень зависит от конкретной ситуации. Мы предоставим актуальный список после первичной консультации.'],
  ['Можно ли выбрать только отдельные услуги?', 'Да. Состав помощи согласуется индивидуально, без обязательного включения дополнительных позиций.'],
  ['Как узнать итоговую стоимость?', 'После выбора услуг и принадлежностей специалист подготовит понятный предварительный расчёт.'],
  ['Можно ли обратиться ночью?', 'Да, консультационная линия работает круглосуточно, включая выходные и праздничные дни.'],
]

function FaqList({ limit }: { limit?: number }) {
  const [active, setActive] = useState(0)
  return <div className="faq">{questions.slice(0,limit).map(([q,a],i)=><div className="faq-item" key={q}><button onClick={()=>setActive(active===i?-1:i)}><span>{q}</span><b>{active===i?'−':'+'}</b></button>{active===i&&<p>{a}</p>}</div>)}</div>
}

function InfoPage() {
  const articles=['Что делать в первую очередь','Какие документы могут понадобиться','Как выбрать ритуальные принадлежности','Из чего складывается стоимость похорон','Кремация: основные организационные вопросы','Как подготовиться к поминальной церемонии']
  return <PageShell title="Полезная информация" intro="Практические материалы о порядке действий, документах и организации церемонии.">
    <div className="article-list">{articles.map((x,i)=><article key={x}><span>Информация · [дата]</span><h2>{x}</h2><p>Краткие разъяснения и практические рекомендации, которые помогут сориентироваться в последовательности действий.</p><button className="text-link">Читать далее <Icon name="arrow"/></button></article>)}</div>
  </PageShell>
}

function Contacts() {
  return <PageShell title="Контакты" intro="Мы готовы ответить на вопросы и помочь определить дальнейший порядок действий." aside={false}>
    <div className="contacts-grid"><div className="contact-details"><div><small>Круглосуточный телефон</small><a href="tel:+70000000000">+7 (000) 000-00-00</a></div><div><small>Дополнительный телефон</small><a href="tel:+70000000001">+7 (000) 000-00-01</a></div><div><small>Адрес</small><strong>Адрес офиса уточняется</strong></div><div><small>Режим работы</small><strong>Круглосуточно, без выходных</strong></div><div className="map">Место для карты</div></div><CallbackForm/></div>
  </PageShell>
}

function CallbackForm() {
  const [sent,setSent]=useState(false)
  return <form className="callback" onSubmit={e=>{e.preventDefault();setSent(true)}}><span>Обратная связь</span><h2>Заказать звонок</h2><p>Оставьте номер — специалист свяжется с вами для консультации.</p><label>Ваше имя<input placeholder="Как к вам обращаться"/></label><label>Телефон<input required placeholder="+7 (___) ___-__-__"/></label><label className="consent"><input type="checkbox" required/> <span>Согласен на обработку персональных данных</span></label><Button>{sent?'Форма не подключена':'Заказать звонок'}</Button>{sent&&<p className="success">Форма пока не подключена к серверу. Пожалуйста, позвоните по указанному номеру.</p>}</form>
}

function About() {
  return <PageShell title="О компании" intro="Ритуальная служба «Память» помогает семьям решать организационные вопросы спокойно, последовательно и с уважением.">
    <div className="editorial"><h2>Наш подход к работе</h2><p>Мы считаем важными деликатное общение, понятное объяснение каждого этапа и прозрачное согласование состава услуг. Фактические сведения о компании, реквизиты и документы будут добавлены после подтверждения.</p><div className="principles">{['Уважительное отношение','Понятный порядок действий','Согласование стоимости','Круглосуточная связь'].map((x,i)=><div key={x}><span>0{i+1}</span><h3>{x}</h3></div>)}</div><h2>В каких вопросах мы помогаем</h2><p>Организация похорон, подбор принадлежностей, транспорт, консультации по документам, кремация, памятники и поминальные мероприятия.</p></div>
  </PageShell>
}

export default function App({ page = 'home' }: { page?: PageKey }) {
  let content: React.ReactNode
  if(page==='home') content=<Home/>
  else if(page==='services') content=<CatalogPage type="services"/>
  else if(page==='products') content=<CatalogPage type="products"/>
  else if(page==='funeral') content=<FuneralPage/>
  else if(page==='prices') content=<PageShell title="Цены на ритуальные услуги" intro="Ниже приведена структура прайс-листа. Актуальная стоимость каждой позиции уточняется до оформления заказа."><PriceTable/><div className="note price-note"><strong>Обратите внимание</strong><p>Итоговая сумма зависит от выбранного состава услуг, принадлежностей и индивидуальных условий. Все цены на сайте являются редактируемыми примерами.</p></div></PageShell>
  else if(page==='about') content=<About/>
  else if(page==='info') content=<InfoPage/>
  else if(page==='faq') content=<PageShell title="Часто задаваемые вопросы" intro="Ответы на основные вопросы об организации похорон и работе службы."><FaqList/></PageShell>
  else if(page==='contacts') content=<Contacts/>
  else content=<PageShell title="Политика конфиденциальности" intro="Шаблон документа для последующего заполнения юридически проверенными сведениями." aside={false}><div className="legal"><h2>Общие положения</h2><p>[Разместите утверждённый текст политики обработки персональных данных.]</p><h2>Согласие на обработку данных</h2><p>[Разместите утверждённый текст согласия и реквизиты оператора.]</p></div></PageShell>
  return <><Header page={page}/>{content}<Footer/></>
}

