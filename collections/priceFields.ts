import type { Field } from 'payload'

type PriceData = {
  price?: unknown
  priceMax?: unknown
  priceMin?: unknown
  priceType?: unknown
}

const isPriceData = (value: unknown): value is PriceData =>
  typeof value === 'object' && value !== null

const isNonnegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const validatePriceConfiguration = (
  priceType: unknown,
  siblingData: unknown,
): true | string => {
  if (!isPriceData(siblingData)) return 'Проверьте заполнение цены.'

  if (priceType === 'fixed') {
    return isNonnegativeNumber(siblingData.price)
      ? true
      : 'Укажите неотрицательную фиксированную цену.'
  }

  if (priceType === 'range') {
    if (!isNonnegativeNumber(siblingData.priceMin)) {
      return 'Укажите неотрицательную минимальную цену.'
    }
    if (!isNonnegativeNumber(siblingData.priceMax)) {
      return 'Укажите неотрицательную максимальную цену.'
    }
    if (siblingData.priceMin > siblingData.priceMax) {
      return 'Минимальная цена не может быть выше максимальной.'
    }
    return true
  }

  return priceType === 'on-request' ? true : 'Выберите тип цены.'
}

const validatePriceField = (
  field: 'price' | 'priceMin' | 'priceMax',
  value: unknown,
  siblingData: unknown,
): true | string => {
  if (!isPriceData(siblingData)) return true

  if (field === 'price' && siblingData.priceType === 'fixed') {
    return isNonnegativeNumber(value)
      ? true
      : 'Укажите неотрицательную фиксированную цену.'
  }

  if (field === 'priceMin' && siblingData.priceType === 'range') {
    if (!isNonnegativeNumber(value)) return 'Укажите неотрицательную минимальную цену.'
    if (
      isNonnegativeNumber(siblingData.priceMax) &&
      value > siblingData.priceMax
    ) {
      return 'Минимальная цена не может быть выше максимальной.'
    }
  }

  if (field === 'priceMax' && siblingData.priceType === 'range') {
    if (!isNonnegativeNumber(value)) return 'Укажите неотрицательную максимальную цену.'
    if (
      isNonnegativeNumber(siblingData.priceMin) &&
      siblingData.priceMin > value
    ) {
      return 'Максимальная цена не может быть ниже минимальной.'
    }
  }

  return true
}

const validatePriceTypeField = (
  value: unknown,
  { siblingData }: { siblingData: unknown },
): true | string => validatePriceConfiguration(value, siblingData)

const validatePriceNumberField = (
  field: 'price' | 'priceMin' | 'priceMax',
  value: unknown,
  { siblingData }: { siblingData: unknown },
): true | string => validatePriceField(field, value, siblingData)

const createPriceFieldValidator = (
  field: 'price' | 'priceMin' | 'priceMax',
): ((value: unknown, options: { siblingData: unknown }) => true | string) =>
  (value, options) => validatePriceNumberField(field, value, options)

export const createPriceFields = (): Field[] => [
  {
    name: 'priceType',
    type: 'select',
    required: true,
    defaultValue: 'on-request',
    label: 'Тип цены',
    options: [
      { label: 'Фиксированная цена', value: 'fixed' },
      { label: 'Диапазон', value: 'range' },
      { label: 'По запросу', value: 'on-request' },
    ],
    validate: validatePriceTypeField,
  },
  {
    name: 'price',
    type: 'number',
    min: 0,
    label: 'Цена, ₽',
    validate: createPriceFieldValidator('price'),
    admin: {
      condition: (_, siblingData) => siblingData?.priceType === 'fixed',
    },
  },
  {
    name: 'priceMin',
    type: 'number',
    min: 0,
    label: 'Цена от, ₽',
    validate: createPriceFieldValidator('priceMin'),
    admin: {
      condition: (_, siblingData) => siblingData?.priceType === 'range',
    },
  },
  {
    name: 'priceMax',
    type: 'number',
    min: 0,
    label: 'Цена до, ₽',
    validate: createPriceFieldValidator('priceMax'),
    admin: {
      condition: (_, siblingData) => siblingData?.priceType === 'range',
    },
  },
]
