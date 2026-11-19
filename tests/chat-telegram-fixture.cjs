// Redirect only Bot API calls made with the integration test's synthetic token.
const originalFetch = globalThis.fetch
globalThis.fetch = function (input, init) {
  const url = typeof input === 'string' ? input : input.url || String(input)
  if (url === 'https://api.telegram.org/bot713:test-chat-fixture/sendMessage') {
    return originalFetch(process.env.CHAT_FIXTURE_URL, init || (input instanceof Request ? input : undefined))
  }
  return originalFetch(input, init)
}
