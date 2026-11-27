export function externalLink(value: unknown) {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value) || /[\\\s]/.test(value)) return null
  try {
    const url = new URL(value)
    return !url.username && !url.password && url.hostname ? url.href : null
  } catch { return null }
}
