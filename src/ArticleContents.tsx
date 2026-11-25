'use client'

import { useId, useState } from 'react'

export default function ArticleContents({ sections }: { sections: { id: string; title: string }[] }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  return <nav className="article-contents" aria-label="Содержание страницы">
    <span>На этой странице</span>
    <button type="button" aria-controls={id} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
      На этой странице <i className="nav-chevron" aria-hidden="true" />
    </button>
    <ul id={id} className={expanded ? 'expanded' : ''}>{sections.map(section =>
      <li key={section.id}><a href={'#' + section.id} onClick={() => setExpanded(false)}>{section.title}</a></li>
    )}</ul>
  </nav>
}
