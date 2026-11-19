export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_PHASE !== 'phase-production-build' && process.env.TELEGRAM_CHAT_BOT_TOKEN && process.env.TELEGRAM_CHAT_GROUP_ID) {
    const { startDelivery } = await import('./src/lib/chat-worker')
    startDelivery()
  }
}
