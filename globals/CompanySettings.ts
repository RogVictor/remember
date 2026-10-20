import type { GlobalConfig } from 'payload'
import { isAdminUser } from '../collections/access'

export const CompanySettings: GlobalConfig = {
  slug: 'company-settings',
  label: 'Настройки компании',
  access: {
    read: () => true,
    update: ({ req }) => isAdminUser(req.user),
  },
  fields: [
    { name: 'companyName', type: 'text', required: true, defaultValue: 'Ритуальная служба «Память»', label: 'Название компании' },
    { name: 'city', type: 'text', required: true, defaultValue: 'Москва', label: 'Город' },
    { name: 'phone', type: 'text', label: 'Основной телефон' },
    { name: 'additionalPhone', type: 'text', label: 'Дополнительный телефон' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'address', type: 'text', label: 'Адрес' },
    { name: 'workingHours', type: 'text', defaultValue: 'Круглосуточно, без выходных', label: 'Режим работы' },
    { name: 'messengerUrl', type: 'text', label: 'Ссылка на мессенджер' },
  ],
}
