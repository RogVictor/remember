import { chatPool } from './chat-db'
import { chatConfigured, dispatchOne, telegramConfig } from './chat-telegram'

const worker = globalThis as typeof globalThis & { chatDeliveryStarted?: boolean }
export function startDelivery() {
  if (worker.chatDeliveryStarted) return
  const config = telegramConfig()
  if (!chatConfigured(config)) return
  worker.chatDeliveryStarted = true
  async function tick() {
    try { await dispatchOne(await chatPool(), config) }
    catch { console.error('[Chat] Delivery queue unavailable') }
    finally { setTimeout(tick, 3000).unref() }
  }
  setTimeout(tick, 1000).unref()
}
