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
    { name: 'brandSlogan', type: 'text', defaultValue: 'Ритуальная служба', label: 'Девиз под названием компании' },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Логотип компании' },
    { name: 'phone', type: 'text', defaultValue: '+7 (000) 000-00-00', label: 'Основной телефон' },
    { name: 'additionalPhone', type: 'text', defaultValue: '+7 (000) 000-00-01', label: 'Дополнительный телефон' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'address', type: 'text', defaultValue: 'Адрес офиса уточняется', label: 'Адрес' },
    { name: 'workingHours', type: 'text', defaultValue: 'Круглосуточно, без выходных', label: 'Режим работы' },
    { name: 'messengerUrl', type: 'text', label: 'Ссылка на мессенджер' },
  ],
}
