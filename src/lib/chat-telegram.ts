import { timingSafeEqual } from 'node:crypto'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { ChatError, digest, transaction } from './chat-store'
import { requestTelegram } from './telegram-api.mjs'

type Pool = PostgresAdapter['pool']

export function telegramConfig() {
  return {
    bot: process.env.TELEGRAM_CHAT_BOT_TOKEN || '',
    group: process.env.TELEGRAM_CHAT_GROUP_ID || '',
    operators: (process.env.TELEGRAM_CHAT_OPERATOR_IDS || '').split(',').map(id => id.trim()).filter(Boolean),
    secret: process.env.TELEGRAM_CHAT_WEBHOOK_SECRET || '',
  }
}
type Config = ReturnType<typeof telegramConfig>
export function chatConfigured(config = telegramConfig()) {
  return /^\d+:[A-Za-z0-9_-]+$/.test(config.bot) && /^-\d+$/.test(config.group) &&
    /^[A-Za-z0-9_-]{1,256}$/.test(config.secret) && config.operators.length > 0 &&
    config.operators.every(id => /^[1-9]\d*$/.test(id))
}
export function checkSecret(config: Config, supplied: string) {
  if (!config.secret || !timingSafeEqual(digest(config.secret), digest(supplied))) throw new ChatError(403)
}

// Serialize dispatch and mapping lookup so a fast Reply sees the committed mapping.
const deliveryLock = 'SELECT pg_advisory_xact_lock(219847312)'
export async function dispatchOne(pool: Pool, config: Config) {
  return transaction(pool, async client => {
    await client.query(deliveryLock)
    const { rows: [row] } = await client.query("SELECT id, session_id, text, attempts FROM chat_messages WHERE retry_at <= now() AND author='visitor' ORDER BY retry_at,id LIMIT 1 FOR UPDATE")
    if (!row) return
    let messageId: number
    let delay = Math.min(300, 5 * 2 ** Math.min(6, Number(row.attempts)))
    try {
      const response = await requestTelegram(config.bot, 'sendMessage', {
        chat_id: config.group, text: 'Диалог №' + row.session_id + '\n\n' + row.text,
      })
      const data = await response.json() as {
        ok?: boolean
        parameters?: { retry_after?: number }
        result?: { chat?: { id?: number }; message_id?: number }
      } | null
      const retryAfter = data?.parameters?.retry_after
      if (typeof retryAfter === 'number' && Number.isSafeInteger(retryAfter)) delay = Math.max(delay, retryAfter)
      const id = data?.result?.message_id
      if (!response.ok || !data?.ok || String(data.result?.chat?.id) !== config.group || typeof id !== 'number' || !Number.isSafeInteger(id)) throw new Error()
      messageId = id
    } catch {
      await client.query("UPDATE chat_messages SET attempts=attempts+1,retry_at=now()+$2 * interval '1 second' WHERE id=$1", [row.id, delay])
      return
    }
    await client.query('UPDATE chat_messages SET telegram_group=$2, telegram_message=$3, retry_at=NULL, attempts=attempts+1 WHERE id=$1', [row.id, config.group, messageId])
  })
}

type Update = {
  update_id?: number
  message?: { chat?: {id?: number}, from?: {id?: number, is_bot?: boolean}, sender_chat?: unknown,
    reply_to_message?: {message_id?: number, from?: {id?: number}}, text?: string }
}
export async function receiveReply(pool: Pool, config: Config, update: Update) {
  const msg = update?.message
  const reply = msg?.reply_to_message
  if (!msg || !Number.isSafeInteger(update.update_id) || String(msg.chat?.id) !== config.group ||
    !msg.from?.id || msg.from.is_bot || msg.sender_chat || !config.operators.includes(String(msg.from.id)) ||
    !Number.isSafeInteger(reply?.message_id) || String(reply?.from?.id) !== config.bot.split(':')[0] ||
    typeof msg.text !== 'string' || !msg.text.trim() || msg.text.length > 8192 || msg.text.includes('\0')) return
  await transaction(pool, async client => {
    await client.query(deliveryLock)
    const { rows: [chat] } = await client.query(`SELECT s.id,s.status FROM chat_sessions s JOIN chat_messages m ON s.id=m.session_id
      WHERE m.telegram_group=$1 AND m.telegram_message=$2 AND m.author='visitor' FOR UPDATE OF s`, [config.group, reply?.message_id])
    if (!chat || chat.status === 'closed') return
    const result = await client.query("INSERT INTO chat_messages(session_id,author,text,telegram_update) VALUES ($1,'operator',$2,$3) ON CONFLICT (telegram_update) DO NOTHING", [chat.id, msg.text, update.update_id])
    if (result.rowCount) await client.query("UPDATE chat_sessions SET status='active',updated_at=now() WHERE id=$1", [chat.id])
  })
}
