import { createHash, randomBytes } from 'node:crypto'
import type { PostgresAdapter } from '@payloadcms/db-postgres'

type Pool = PostgresAdapter['pool']
type TransactionClient = import('pg').PoolClient

export class ChatError extends Error {
  constructor(readonly status: number) { super('Chat request failed') }
}
export const digest = (value: string) => createHash('sha256').update(value).digest()
export async function transaction<T>(pool: Pool, fn: (client: TransactionClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const value = await fn(client)
    await client.query('COMMIT')
    return value
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function newSession(pool: Pool) {
  const token = randomBytes(32).toString('hex')
  await pool.query('INSERT INTO chat_sessions(token_hash) VALUES ($1)', [digest(token).toString('hex')])
  return token
}

export async function session(pool: Pool | TransactionClient, token: string, lock = false) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ChatError(401)
  const result = await pool.query('SELECT id,status FROM chat_sessions WHERE token_hash=$1' + (lock ? ' FOR UPDATE' : ''), [digest(token).toString('hex')])
  if (!result.rowCount) throw new ChatError(401)
  return result.rows[0]
}

export async function saveVisitor(pool: Pool, token: string, key: unknown, raw: unknown) {
  const text = typeof raw === 'string' && raw.trim()
  if (!text || text.length > 2000 || text.includes('\0') || typeof key !== 'string' || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(key)) throw new ChatError(400)
  await transaction(pool, async client => {
    const chat = await session(client, token, true)
    const existing = await client.query('SELECT text FROM chat_messages WHERE session_id=$1 AND client_key=$2', [chat.id, key])
    if (existing.rowCount) {
      if (existing.rows[0].text !== text) throw new ChatError(409)
      return
    }
    if (chat.status === 'closed') throw new ChatError(409)
    await client.query("INSERT INTO chat_messages(session_id, author, text, client_key, retry_at) VALUES ($1,'visitor',$2,$3,now())", [chat.id, text, key])
    await client.query('UPDATE chat_sessions SET updated_at=now() WHERE id=$1', [chat.id])
  })
}

export async function history(pool: Pool, token: string, after: number) {
  if (!Number.isSafeInteger(after) || after < 0 || after > 2147483647) throw new ChatError(400)
  const chat = await session(pool, token)
  const { rows } = await pool.query('SELECT id,author,text,created_at AS "createdAt" FROM chat_messages WHERE session_id=$1 AND id>$2 ORDER BY id LIMIT 100', [chat.id, after])
  return { messages: rows, closed: chat.status === 'closed' }
}
