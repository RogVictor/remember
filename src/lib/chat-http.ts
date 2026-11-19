import { isIP } from 'node:net'
import { ChatError, digest } from './chat-store'

const windows = new Map<string, { count: number, until: number }>()
let cleanup = 0
export function limit(request: Request, action: string, max: number, now = Date.now()) {
  const ip = request.headers.get('x-real-ip')?.trim()
  if (process.env.NODE_ENV === 'production' && (!ip || !isIP(ip))) throw new ChatError(503)
  if (now >= cleanup) {
    for (const [key, bucket] of windows) if (bucket.until <= now) windows.delete(key)
    cleanup = now + 60000
  }
  const key = action + digest(ip || 'local').toString('hex')
  let bucket = windows.get(key)
  if (!bucket || now >= bucket.until) {
    if (!bucket && windows.size >= 50000) throw new ChatError(429)
    bucket = { count: 0, until: now + 60000 }
    windows.set(key, bucket)
  }
  if (++bucket.count > max) throw new ChatError(429)
}

export async function jsonBody(request: Request, max: number) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new ChatError(415)
  const reader = request.body?.getReader()
  if (!reader) throw new ChatError(400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > max) { await reader.cancel(); throw new ChatError(413) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error()
    return data
  } catch { throw new ChatError(400) }
}
