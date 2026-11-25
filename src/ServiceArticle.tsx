import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { Page } from '../payload-types'
import { record } from './seo/content'
import ArticleContents from './ArticleContents'

type Content = NonNullable<Page['content']>
type Node = Content['root']['children'][number]
type Section = { title: string; id: string; nodes: Node[]; faq?: boolean }

function headingText(value: unknown): string {
  const node = record(value)
  if (typeof node?.text === 'string') return node.text
  return Array.isArray(node?.children) ? node.children.map(headingText).join('') : ''
}

function articleSections(nodes: Node[]) {
  const sections: Section[] = [{ title: '', id: '', nodes: [] }]
  for (const node of nodes) {
    const categoryBlock = node.type === 'block' && record(node.fields)?.blockType === 'category-services'
    const title = categoryBlock ? 'Услуги направления' : node.type === 'heading' && node.tag === 'h2' ? headingText(node).trim() : ''
    if (title) sections.push({ title, id: 'section-' + sections.length, nodes: [], faq: /^(частые вопросы|часто задаваемые вопросы|faq)$/i.test(title) })
    sections[sections.length - 1].nodes.push(node)
  }
  return sections
}

export default function ServiceArticle({ content, converters, related }: {
  content: Content
  converters: JSXConvertersFunction
  related?: React.ReactNode
}) {
  const sections = articleSections(content.root.children)
  const toc = sections.filter(section => section.title).map(({ id, title }) => ({ id, title }))
  if (related) toc.push({ id: 'related-services', title: 'Другие услуги категории' })

  function render(nodes: Node[]) {
    return <RichText disableContainer data={{ ...content, root: { ...content.root, children: nodes } }} converters={converters} />
  }

  function renderFaq(nodes: Node[]) {
    const items = []
    for (let i = 0; i < nodes.length; i++) {
      const question = nodes[i]
      if (question.tag !== 'h3' || nodes[i + 1]?.type !== 'paragraph') {
        items.push(<div key={i}>{render([question])}</div>)
        continue
      }
      const start = i
      while (nodes[i + 1]?.type === 'paragraph') i++
      items.push(<details key={start}>
        <summary>{render([question])}</summary>
        {render(nodes.slice(start + 1, i + 1))}
      </details>)
    }
    return items
  }

  return <div className={toc.length ? 'reading-layout' : 'reading-layout no-contents'}>
    {toc.length > 0 && <ArticleContents sections={toc} />}
    <div className="reading-column">
      {sections.map(section => <div id={section.id || undefined} key={section.id}
        className={section.faq ? 'reading-section article-faq' : 'reading-section'}>
        {section.faq ? renderFaq(section.nodes) : render(section.nodes)}
      </div>)}
      {related && <div id="related-services">{related}</div>}
    </div>
  </div>
}
