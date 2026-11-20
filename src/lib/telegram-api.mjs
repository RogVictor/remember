// @ts-check
import { Agent, fetch, ProxyAgent } from 'undici'

const directAgent = new Agent()
/** @type {ProxyAgent | undefined} */
let proxyAgent

export function telegramConnectionMode() {
  return process.env.TELEGRAM_CHAT_PROXY_URL?.trim() ? 'proxy' : 'direct'
}

function getProxyAgent() {
  const proxyURL = process.env.TELEGRAM_CHAT_PROXY_URL?.trim()
  if (!proxyURL) return undefined
  if (proxyAgent) return proxyAgent

  try {
    const url = new URL(proxyURL)
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
      throw new Error()
    }
    const token = url.username || url.password
      ? 'Basic ' + Buffer.from(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`).toString('base64')
      : undefined
    proxyAgent = new ProxyAgent({ uri: url.origin, token })
    return proxyAgent
  } catch {
    throw new Error('invalid_proxy_configuration')
  }
}

/**
 * @param {string} token
 * @param {'sendMessage' | 'getMe' | 'getUpdates' | 'setWebhook' | 'getWebhookInfo'} method
 * @param {Record<string, unknown>} [payload]
 */
export async function requestTelegram(token, method, payload) {
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error('invalid_bot_token')

  const dispatcher = getProxyAgent() ?? directAgent
  const url = `https://api.telegram.org/bot${token}/${method}`
  const signal = AbortSignal.timeout(8000)
  /** @type {import('undici').RequestInit} */
  const options = {
    dispatcher,
    signal,
    redirect: 'error',
    ...(payload && {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  }
  try {
    return await fetch(url, options)
  } catch {
    throw new Error(signal.aborted ? 'timeout' : 'connection_failed')
  }
}
