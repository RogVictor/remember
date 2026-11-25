'use client'
import { CallbackForm } from '../CallbackForm'
import Link from 'next/link'
import { useState } from 'react'
import { guidePath, guideTitle, situationTitles, situations, type Situation, type Step, type Instructions } from './data'
import './guide.css'

const symbols = {
  home: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
  hospital: 'M4 21V4h16v17zM9 10h6m-3-3v6m-3 8v-5h6v5',
  outside: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z M14 10a2 2 0 1 1-4 0 2 2 0 1 1 4 0z',
  away: 'M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0z M2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20z',
  book: 'M12 6C9 4 5 4 2 5v14c3-1 7-1 10 1 3-2 7-2 10-1V5c-3-1-7-1-10 1zm0 0v14',
}
function GuideIcon({ name }: { name: keyof typeof symbols }) {
  return <svg className="guide-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={symbols[name]} /></svg>
}
export function GuideShortcut() {
  return <Link className="guide-shortcut" href={guidePath}><GuideIcon name="book"/><span><strong>{guideTitle}</strong><small>Пошаговая инструкция для родственников.</small></span><span aria-hidden="true">→</span></Link>
}
export function GuideFeedback({ source }: { source: string }) {
  return <div className="guide-feedback"><CallbackForm feedback source={source} id="feedback"/></div>
}
export function SituationPicker({ value, onSelect }: { value: Situation; onSelect: (key: Situation) => void }) {
  return <div className="guide-picker" role="group" aria-label="Обстоятельства смерти">{situations.map(key =>
    <button type="button" key={key} aria-pressed={key === value} aria-controls="guide-steps" onClick={() => onSelect(key)}>
      <GuideIcon name={key}/><span>{situationTitles[key]}</span>
    </button>)}</div>
}
export function Steps({ steps, detailed = false }: { steps: Step[]; detailed?: boolean }) {
  return <ol className="guide-steps">{steps.map(step => <li key={step.summary}><strong>{step.summary}</strong>{detailed && <p>{step.detail}</p>}</li>)}</ol>
}
export function GuidePreview({ data }: { data: Instructions }) {
  const [selected, select] = useState<Situation>('home')
  return <section className="guide-preview"><div className="container section">
    <div className="section-title"><h2>Что делать, если умер человек?</h2></div>
    <p>Порядок действий зависит от обстоятельств смерти. Выберите вашу ситуацию, чтобы узнать, с чего начать.</p>
    <SituationPicker value={selected} onSelect={select}/>
    <div id="guide-steps" className="guide-panel"><Steps steps={data[selected]}/>
      <Link className="guide-action" href={guidePath + '?situation=' + selected + '#situations'}>Читать подробную инструкцию <span aria-hidden="true">→</span></Link>
    </div><GuideFeedback source="/#feedback"/>
  </div></section>
}

