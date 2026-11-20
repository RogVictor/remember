import { requestTelegram, telegramConnectionMode } from '../src/lib/telegram-api.mjs'

const mode = telegramConnectionMode()
let status
let result
try {
  const response = await requestTelegram(process.env.TELEGRAM_CHAT_BOT_TOKEN || '', 'getMe')
  status = response.status
  if (!response.ok) {
    result = 'http_error'
    await response.body?.cancel().catch(() => {})
  }
  else {
    try {
      const data = await response.json()
      result = data?.ok === true && data.result?.is_bot === true ? 'ok' : 'invalid_api_response'
    } catch {
      result = 'invalid_api_response'
    }
  }
} catch (error) {
  result = ['invalid_proxy_configuration', 'invalid_bot_token', 'timeout', 'connection_failed'].includes(error?.message)
    ? error.message
    : 'check_failed'
}

console.log(JSON.stringify({ mode, status, result }))
if (result !== 'ok') process.exitCode = 1
