import { NextRequest, NextResponse } from 'next/server'
import { chatPool } from '@/lib/chat-db'
import { ChatError, history, newSession, saveVisitor, session } from '@/lib/chat-store'
import { chatConfigured, checkSecret, receiveReply, telegramConfig } from '@/lib/chat-telegram'
import { limit, jsonBody } from '@/lib/chat-http'

export const runtime = 'nodejs'
type Context = { params: Promise<{ action: string }> }
const cookie = 'remember_chat'
function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 && { 'Retry-After': '60' }) } })
}
function failure(e: unknown) {
  return response({ error: 'Не удалось выполнить запрос.' }, e instanceof ChatError ? e.status : 503)
}

export async function GET(req: NextRequest, ctx: Context) {
  try {
    if ((await ctx.params).action !== 'messages') return response({}, 404)
    limit(req, 'poll', 240)
    return response(await history(await chatPool(), req.cookies.get(cookie)?.value || '', Number(req.nextUrl.searchParams.get('after') || 0)))
  } catch (e) { return failure(e) }
}

export async function POST(req: NextRequest, ctx: Context) {
  try {
    const { action } = await ctx.params
    if (action === 'webhook') {
      const config = telegramConfig()
      checkSecret(config, req.headers.get('x-telegram-bot-api-secret-token') || '')
      const update = await jsonBody(req, 65536)
      await receiveReply(await chatPool(), config, update)
      return response({ ok: true })
    }
    if (action !== 'session' && action !== 'messages') return response({}, 404)
    if (!chatConfigured()) throw new ChatError(503)
    if (req.headers.get('origin') !== new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url).origin) throw new ChatError(403)
    limit(req, action, action === 'session' ? 12 : 20)
    const data = await jsonBody(req, 16384)
    const token = req.cookies.get(cookie)?.value || ''
    const pool = await chatPool()
    if (action === 'session') {
      if (token) {
        try { await session(pool, token); return response({ ok: true }) }
        catch (e) { if (!(e instanceof ChatError && e.status === 401)) throw e }
      }
      const result = response({ ok: true }, 201)
      result.cookies.set(cookie, await newSession(pool), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/chat', maxAge: 60 * 60 * 24 * 90 })
      return result
    }
    await saveVisitor(pool, token, data.key, data.text)
    return response({ ok: true })
  } catch (e) { return failure(e) }
}
