import type { Metadata } from 'next'
import App from '../../src/App'
import { getFAQs } from '../../src/lib/cms'

const titles: Record<string, string> = {
  services: 'Ритуальные услуги',
  funeral: 'Организация похорон',
  products: 'Ритуальные товары',
  prices: 'Цены',
  about: 'О компании',
  info: 'Полезная информация',
  faq: 'Часто задаваемые вопросы',
  contacts: 'Контакты',
  legal: 'Политика конфиденциальности',
}

export const metadata: Metadata = {
  title: titles['faq'],
  description: 'Ритуальная служба «Память» в Москве. Информация и консультации по организации похорон.',
}

export default async function Page() {
  const faqs = await getFAQs()
  return <App page="faq" faqs={faqs} />
}
