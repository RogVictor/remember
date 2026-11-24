import { createHash } from 'node:crypto'
import { keywordKey } from './model'

export function indexedKeyword(value: unknown) {
  const normalized = keywordKey(value)
  return normalized ? createHash('sha256').update(normalized).digest('hex') : null
}
