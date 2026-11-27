// Shared with Payload's picker. Only these line drawings can be selected.
export const aboutIcons = {
  HeartHandshake: ['M12 20 3.5 12a5 5 0 0 1 7-7l1.5 1.5L13.5 5a5 5 0 0 1 7 7L17 15.5', 'm12 6.5-4 4a2 2 0 0 0 3 2.5l2-2 5 5-4 4-3-3'],
  ReceiptText: ['M5 3l2 1.5L9.5 3 12 4.5 14.5 3 17 4.5 19 3v18l-2-1.5-2.5 1.5-2.5-1.5L9.5 21 7 19.5 5 21z','M8 8h8M8 12h8M8 16h5'],
  Clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z','M12 6v6l4 2'],
  ClipboardCheck: ['M8 5H5v16h14V5h-3M9 3h6v4H9z','m8 14 3 3 5-6'],
  Wallet: ['M20 8H4V5l13-3v5M4 8v12h17V8z','M21 12h-6v4h6'],
  MapPin: ['M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z','M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z'],
  Flower2: ['M12 13c-8 0-8-8-4-7-1-5 6-5 7 0 5-2 6 5 1 6z','M12 13v9m0-3c2-5 5-5 7-5-1 4-3 5-7 5z'],
  Flame: ['M13 2c2 7-3 7-2 11 2 0 4-2 4-5 4 3 6 7 3 11-4 5-13 3-13-4 0-5 6-7 8-13z'],
  FileText: ['M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h6'],
  Package: ['m3 7 9-5 9 5v10l-9 5-9-5zM3 7l9 5 9-5M12 12v10M7 5l9 5'],
  Truck: ['M2 5h12v11H2zM14 9h4l4 4v3h-8M8 18a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 1 1 4 0z'],
  Church: ['M12 2v5M10 4h4M6 21V11l6-4 6 4v10zM10 21v-6h4v6M3 21v-6l3-2m12 0 3 2v6'],
  Landmark: ['m3 8 9-5 9 5zM5 11v7m5-7v7m4-7v7m5-7v7M3 21h18'],
  Utensils: ['M4 3v5a3 3 0 0 0 6 0V3M7 3v18M19 3c-4 3-5 9-1 10h1m0-10v18'],
} as const

export type AboutIconName = keyof typeof aboutIcons
export function isAboutIcon(value: unknown): value is AboutIconName {
  return typeof value === 'string' && Object.hasOwn(aboutIcons, value)
}
