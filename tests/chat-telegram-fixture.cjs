// Redirect only Bot API calls made with the integration test's synthetic token.
const { Agent } = require('undici')
const originalDispatch = Agent.prototype.dispatch
Agent.prototype.dispatch = function (options, handler) {
  if (options.origin === 'https://api.telegram.org' && options.path === '/bot713:test-chat-fixture/sendMessage') {
    return originalDispatch.call(this, { ...options, origin: process.env.CHAT_FIXTURE_URL, path: '/' }, handler)
  }
  return originalDispatch.call(this, options, handler)
}
