const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5
const MAX_CLIENTS = 10_000
const CLEANUP_INTERVAL_MS = 60 * 1000

type RateLimitWindow = {
  count: number
  resetAt: number
}

const clients = new Map<string, RateLimitWindow>()
let nextCleanupAt = 0

export const checkLeadRateLimit = (
  clientIP: string,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } => {
  if (now >= nextCleanupAt) {
    for (const [key, window] of clients) {
      if (window.resetAt <= now) clients.delete(key)
    }
    nextCleanupAt = now + CLEANUP_INTERVAL_MS
  }

  let currentWindow = clients.get(clientIP)
  if (!currentWindow) {
    if (clients.size >= MAX_CLIENTS) {
      const oldestClient = clients.keys().next().value
      if (oldestClient !== undefined) clients.delete(oldestClient)
    }
    currentWindow = { count: 0, resetAt: now + WINDOW_MS }
    clients.set(clientIP, currentWindow)
  }

  if (currentWindow.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((currentWindow.resetAt - now) / 1000)),
    }
  }

  currentWindow.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}
