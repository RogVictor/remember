import type { Block, Field } from 'payload'
import { lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'
import { aboutIcons } from '../src/about/icons'
import { externalLink } from '../src/about/links'
import { staticRoutes } from '../src/seo/routes'

const text = (name: string, label: string): Field => ({ name, label, type: 'text' })
const notes = (name: string, label: string): Field => ({ name, label, type: 'textarea' })
const visible: Field = { name: 'visible', label: 'Показывать на сайте', type: 'checkbox', defaultValue: true }
const photo: Field = { name: 'image', label: 'Изображение', type: 'upload', relationTo: 'media' }
const alt = text('alt', 'Описание изображения (alt)')
const icon: Field = { name: 'icon', label: 'Иконка', type: 'select', options: Object.keys(aboutIcons),
  admin: { components: { Field: '/app/(payload)/admin/components/AboutIconPicker' } } }
const title = text('title', 'Заголовок')
const description = notes('description', 'Описание')
const rows = (label: string, fields: Field[]): Field => ({
  name: 'items', type: 'array', label, labels: { singular: 'карточку', plural: label },
  admin: { initCollapsed: true, description: 'Перетащите строки, чтобы изменить порядок.' },
  fields: [visible, ...fields],
})
const section = (slug: string, label: string, fields: Field[]): Block => ({
  slug, labels: { singular: label, plural: label }, fields: [visible, title, ...fields],
})
const blocks = [
  section('hero', 'Первый экран', [
    text('eyebrow', 'Надзаголовок'), text('subtitle', 'Подзаголовок'), description, photo, alt, text('button', 'Текст кнопки'),
    { name: 'action', type: 'select', label: 'Действие кнопки', defaultValue: 'callback', options: [
      { value: 'callback', label: 'Открыть форму звонка' }, { value: 'phone', label: 'Позвонить' },
      { value: 'section', label: 'Раздел сайта' }, { value: 'page', label: 'Страница из CMS' }, { value: 'external', label: 'Внешняя ссылка HTTPS' },
    ] },
    { name: 'sectionPath', label: 'Раздел сайта', type: 'select', options: Object.entries(staticRoutes).map(([value, label]) => ({ value, label })),
      admin: { condition: (_, row) => row.action === 'section' } },
    { name: 'page', label: 'Страница', type: 'relationship', relationTo: 'pages', filterOptions: { _status: { equals: 'published' } },
      admin: { condition: (_, row) => row.action === 'page' } },
    { name: 'url', label: 'Внешняя ссылка', type: 'text', validate: (v: string | null | undefined) => !v || !!externalLink(v) || 'Укажите HTTPS-адрес без данных авторизации.',
      admin: { condition: (_, row) => row.action === 'external' } },
    text('note', 'Дополнительный текст'),
  ]),
  section('intro', 'Знакомство с компанией', [
    { name: 'body', type: 'richText', label: 'Текст о компании', editor: lexicalEditor({ features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter(f => ['paragraph','bold','italic','unorderedList','orderedList','inlineToolbar','fixedToolbar'].includes(f.key)),
      LinkFeature({ enabledCollections: ['pages'] }),
    ] }) }, photo, alt, { name: 'side', type: 'select', label: 'Расположение изображения', defaultValue: 'right',
      options: [{ value: 'left', label: 'Слева' }, { value: 'right', label: 'Справа' }] },
  ]),
  section('benefits', 'Преимущества', [rows('Преимущества', [title, description,
    { name: 'iconType', type: 'radio', label: 'Тип иконки', defaultValue: 'library', options: [
      { value: 'library', label: 'Из библиотеки' }, { value: 'image', label: 'Своя иконка' },
    ] }, { ...icon, admin: { ...icon.admin, condition: (_, row) => row.iconType !== 'image' } },
    { ...photo, admin: { condition: (_, row) => row.iconType === 'image' } },
  ])]),
  section('competencies', 'Компетенции и услуги', [rows('Карточки услуг', [
    { name: 'service', label: 'Услуга каталога', type: 'relationship', relationTo: 'services', maxDepth: 0,
      admin: { description: 'Карточка появится на сайте после публикации связанной услуги.' } },
    text('title', 'Альтернативное название'), notes('description', 'Альтернативное описание'), icon, photo, alt,
  ])]),
  section('steps', 'Этапы работы', [rows('Этапы', [title, description, icon])]),
  section('team', 'Наша команда', [rows('Сотрудники', [
    text('firstName','Имя'), text('lastName','Фамилия'), text('middleName','Отчество'), text('role','Должность'),
    description, notes('details','Дополнительное описание'), photo, alt,
    { name: 'illustrative', label: 'Изображение иллюстративное', type: 'checkbox', defaultValue: false },
  ])]),
  section('legal', 'Документы и реквизиты', [description, rows('Публичные документы', [
    { name: 'file', type: 'relationship', label: 'Документ PDF', relationTo: 'public-documents' },
  ])]),
  section('contact', 'Заключительное обращение', [description, text('call','Текст кнопки звонка'), text('callback','Текст кнопки формы'),
    text('note','Дополнительный текст'), { name: 'showHours', type: 'checkbox', label: 'Показывать режим работы из настроек компании', defaultValue: true }]),
]

export const aboutSections: Field = {
  type: 'collapsible', label: 'О компании', admin: { initCollapsed: false, condition: data => data.route === '/about' },
  fields: [
    { name: 'aboutInitialized', type: 'checkbox', admin: { hidden: true },
      hooks: { beforeChange: [({ data, value }) => data?.route === '/about' ? true : value] } },
    { name: 'sections', label: 'Секции страницы', labels: { singular: 'секцию', plural: 'секции' }, type: 'blocks', blocks,
      access: { read: ({ req }) => !!req.user || req.context.aboutRendering === true },
      admin: { initCollapsed: true, description: 'Меняйте порядок перетаскиванием. У каждой секции есть флажок видимости.' },
      validate: value => !Array.isArray(value) || new Set(value.map(block => block.blockType)).size === value.length || 'Каждую секцию можно добавить один раз.',
    },
  ],
}
