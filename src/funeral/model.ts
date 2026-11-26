export const formats = { burial: 'Захоронение', cremation: 'Кремация' }
export const states = {
  included: 'Включено',
  optional: 'Доступно дополнительно',
  separate: 'Оплачивается отдельно',
  absent: 'Не предусмотрено',
  negotiated: 'По согласованию',
}
export const groups = {
  coffin: 'Гроб',
  lining: 'Внутреннее убранство',
  accessories: 'Принадлежности',
  flowers: 'Флористика',
  cross: 'Крест и табличка',
  urn: 'Урна',
  agent: 'Ритуальный агент',
  papers: 'Документы',
  transport: 'Транспорт',
  team: 'Бригада',
  ceremony: 'Церемония',
  extra: 'Дополнительные услуги',
}
export const priceTypes = {
  fixed: 'Фиксированная цена',
  from: 'Цена от',
  individual: 'Индивидуальный расчёт',
  request: 'Цена по запросу',
}
export const money = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)
export function displayPrice(offer: {
  priceType?: keyof typeof priceTypes | null
  amount?: number | null
}) {
  if (offer.priceType === 'individual') return priceTypes.individual
  if (
    (offer.priceType === 'fixed' || offer.priceType === 'from') &&
    typeof offer.amount === 'number' &&
    offer.amount > 0
  )
    return (offer.priceType === 'from' ? 'от ' : '') + money(offer.amount)
  return priceTypes.request
}
export const sections = {
  offers: 'Комплексы ритуальных услуг',
  comparison: 'Сравнение комплексов',
  directions: 'Что входит в организацию похорон',
  extras: 'Дополнительные услуги',
  programs: 'Специальные программы',
  steps: 'Этапы организации похорон',
  documents: 'Необходимые документы',
  advantages: 'Наш подход',
  geography: 'География работы',
  articles: 'Полезная информация',
  faq: 'Частые вопросы',
  callback: 'Получить консультацию',
}
export const funeralTitle = 'Организация похорон в Москве и Московской области'
export const funeralIntro =
  'Комплексная организация похорон с учётом ваших пожеланий, традиций и финансовых возможностей.'
export const funeralSteps = [
  'Первичная консультация',
  'Выбор формата и состава услуг',
  'Согласование стоимости',
  'Организационное сопровождение',
]
