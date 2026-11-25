'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Consultation, SituationPicker, Steps } from './GuideControls'
import ActionPlan from './ActionPlan'
import { guideFaq, isSituation, situations, situationTitles, type Instructions, type Situation } from './data'

function EmergencyPhones() {
  return <section className="guide-emergency"><h2>Экстренные службы России</h2>
    <p>Если есть шанс, что человек жив, сразу звоните 103 или 112 и выполняйте указания диспетчера.</p>
    <div>{[['112', 'Единый номер экстренных служб'], ['103', 'Скорая медицинская помощь'], ['102', 'Полиция']].map(([number, name]) =>
      <a key={number} href={'tel:' + number}><strong>{number}</strong>{name}</a>)}</div>
  </section>
}

export default function GuidePage({ data }: { data: Instructions }) {
  const query = useSearchParams().get('situation')
  const selected = isSituation(query) ? query : 'home'
  function select(key: Situation) {
    if (key === selected) return
    const url = new URL(window.location.href)
    url.searchParams.set('situation', key)
    url.hash = 'situations'
    window.history.pushState(null, '', url)
  }
  return <div className="guide-body">
    <EmergencyPhones/>
    <section id="situations"><h2>Где это произошло?</h2>
      <SituationPicker value={selected} onSelect={select}/>
      <div id="guide-steps" className="guide-panel">{situations.map(key => <section key={key} hidden={selected !== key}>
        <h3>{situationTitles[key]}</h3><Steps steps={data[key]} detailed/>
      </section>)}</div>
    </section>
    <section><h2>Какие документы подготовить</h2><ul>
      <li>Ваш паспорт или другой документ, удостоверяющий личность заявителя.</li>
      <li>Паспорт умершего, если он у вас. Если документ утрачен, уточните порядок обращения в ЗАГС.</li>
      <li>Для регистрации на медицинском основании — сведения о медицинском свидетельстве о смерти. В медорганизации уточните, оформлено ли оно в электронном виде.</li>
    </ul><p>Если смерть произошла за границей, перечень зависит от страны оформления. Уточните его в консульстве до заказа перевода документов.</p></section>
    <ActionPlan key={selected} situation={selected} steps={data[selected]}/>
    <section><h2>Что поможет избежать ошибок</h2><ul><li>Записывайте названия учреждений и телефоны отделений. Перед поездкой уточняйте часы выдачи документов.</li><li>Если вам звонят с предложением платных услуг, возьмите время на решение. Попросите перечень работ и итоговую стоимость в письменном виде.</li></ul></section>
    <section><h2>Москва и Московская область</h2><p>Если больница находится в Москве, а семья живёт в Подмосковье, сначала уточните место выдачи медицинского свидетельства в самой больнице. Для регистрации смерти проверьте адрес и порядок приёма в выбранном отделении ЗАГС или центре госуслуг.</p>
      <p>В Москве адреса центров можно посмотреть на городском портале. Для Подмосковья ответы об услуге собраны на сайте областного управления ЗАГС.</p><a href="https://www.mos.ru/pgu/ru/md/">Центры госуслуг Москвы</a> · <a href="#guide-sources">Разъяснения ЗАГС Московской области</a></section>
    <section><h2>Дальнейшая организация похорон</h2><p>Когда станет известно, где и когда можно получить документы, обсудите с близкими пожелания к прощанию. Уточните доступные даты и состав услуг перед оформлением заказа.</p>
      <Link href="/funeral">Порядок организации похорон</Link> · <Link href="/services">Услуги службы</Link></section>
    <section><h2>Часто задаваемые вопросы</h2>{guideFaq.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>
    <Consultation/>
    <section id="guide-sources"><h2>Официальные источники</h2><p>Справочные сведения проверены <time dateTime="2026-11-26">26 ноября 2026 года</time>.</p>
      <ul><li><a href="https://dgp81.mos.ru/spiski-telefonov-dezhurnyx-i-ekstrennyx-sluzhb/">Департамент здравоохранения Москвы — телефоны экстренных служб</a></li>
      <li><a href="https://mosreg.ru/web-reception/otvety-na-naibolee-chasto-vstrechayushiesya-voprosy-v-obrasheniyakh-grazhdan/voprosy-glavnogo-upravleniya-zapisi-aktov-grazhdanskogo-sostoyaniya-moskovskoi-oblasti">Главное управление ЗАГС Московской области — регистрация смерти</a></li>
      <li><a href="https://www.kdmid.ru/cons/registration-of-acts-of-civil-status/">Консульский департамент МИД России — регистрация актов гражданского состояния за рубежом</a></li></ul>
    </section>
  </div>
}

