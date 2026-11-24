type Node = Record<string, unknown>
export const record = (value: unknown): Node | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Node : null

export function inspectContent(content: unknown, assets?: ReadonlyMap<number, Node>) {
  const result = { text: '', headings: [] as string[], links: [] as string[], missingAlt: 0, unknownMedia: 0,
    images: 0, unresolvedMediaIds: new Set<number>(), blocks: [] as Node[], unknown: false }
  const visit = (value: unknown): string => {
    const node = record(value)
    if (!node) return ''
    switch (node.type) {
      case 'text':
        return typeof node.text === 'string' ? node.text : ''
      case 'linebreak':
        return '\n'
      case 'horizontalrule':
        return ''
      case 'block': {
        const fields = record(node.fields)
        if (fields) result.blocks.push(fields)
        result.unknown = true
        return ''
      }
      case 'upload': {
        result.images++
        const id = typeof node.value === 'number' && node.relationTo === 'media' ? node.value : null
        const media = record(node.value) ?? (id == null ? undefined : assets?.get(id))
        if (media?.decorative !== true) {
          const alt = record(node.fields)?.alt || media?.alt
          if (typeof alt === 'string' && alt.trim()) return ''
          if (!media || !Object.hasOwn(media, 'alt')) {
            result.unknownMedia++
            if (id != null) result.unresolvedMediaIds.add(id)
          } else result.missingAlt++
        }
        return ''
      }
      case 'heading':
        if (typeof node.tag === 'string') result.headings.push(node.tag)
        break
      case 'link':
      case 'autolink': {
        const fields = record(node.fields)
        if (fields?.linkType === 'internal') result.links.push('internal')
        else if (typeof fields?.url === 'string') result.links.push(fields.url)
        break
      }
      case 'root':
      case 'paragraph':
      case 'quote':
      case 'list':
      case 'listitem':
        break
      default:
        result.unknown = true
        return ''
    }
    const children = Array.isArray(node.children) ? node.children.map(visit) : []
    return ['root', 'list'].includes(String(node.type)) ? children.join('\n') : children.join('')
  }
  result.text = visit(record(content)?.root).trim()
  return result
}
