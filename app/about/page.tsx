import type { Metadata } from 'next'
import App from '../../src/App'

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
  title: titles['about'],
  description: 'Ритуальная служба «Память» в Москве. Информация и консультации по организации похорон.',
}

export default function Page() { return <App page="about" /> }
