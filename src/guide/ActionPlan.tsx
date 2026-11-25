'use client'
import { useState, useSyncExternalStore } from 'react'
import { situationTitles, type Situation, type Step } from './data'

const transient = new Map<string, string>()
function subscribe(refresh: () => void) {
  window.addEventListener('storage', refresh)
  window.addEventListener('guide-plan-change', refresh)
  return () => {
    window.removeEventListener('storage', refresh)
    window.removeEventListener('guide-plan-change', refresh)
  }
}
function read(key: string) {
  if (transient.has(key)) return transient.get(key)!
  try { return localStorage.getItem(key) || '[]' } catch { return '[]' }
}
function selectedSteps(raw: string, steps: Step[]) {
  try {
    const saved: unknown = JSON.parse(raw)
    if (Array.isArray(saved)) return steps.map(step => step.summary).filter(label => saved.includes(label))
  } catch { /* Ignore unreadable saved data. */ }
  return []
}
export default function ActionPlan({ situation, steps }: { situation: Situation; steps: Step[] }) {
  const storageKey = 'ritualgroup24.guide.v1.' + situation
  const raw = useSyncExternalStore(subscribe, () => read(storageKey), () => '[]')
  const checked = selectedSteps(raw, steps)
  const [notice, setNotice] = useState('')
  const [manualCopy, setManualCopy] = useState(false)
  function save(next: string[]) {
    const serialized = JSON.stringify(next)
    setNotice('')
    try { localStorage.setItem(storageKey, serialized); transient.delete(storageKey) }
    catch { transient.set(storageKey, serialized); setNotice('Браузер сохраняет отметки только до закрытия страницы.') }
    window.dispatchEvent(new Event('guide-plan-change'))
  }
  const memo = [situationTitles[situation], ...steps.map(({ summary, detail }) =>
    (checked.includes(summary) ? '☑ ' : '☐ ') + summary + '\n' + detail)].join('\n\n')
  async function copy() {
    try { await navigator.clipboard.writeText(memo); setNotice('Памятка скопирована.') }
    catch { setManualCopy(true); setNotice('Выделите текст памятки и скопируйте его.') }
  }
  return <section className="guide-plan"><h2>Мой план действий</h2><p>{situationTitles[situation]}. Отмечайте шаги, которые подходят вашей семье.</p>
    <div role="status">Выполнено {checked.length} из {steps.length}</div>
    <progress aria-label="Прогресс плана" value={checked.length} max={steps.length}/>
    {steps.map(step => <label key={step.summary}><input type="checkbox" checked={checked.includes(step.summary)}
      onChange={e => save(e.target.checked ? [...checked, step.summary] : checked.filter(value => value !== step.summary))}/>{step.summary}</label>)}
    <div className="guide-actions"><button onClick={copy}>Скопировать памятку</button><button onClick={() => window.print()}>Распечатать</button>
      <button disabled={!checked.length} onClick={() => save([])}>Сбросить отметки</button></div>
    <div role="status">{notice}</div>{manualCopy && <textarea aria-label="Текст памятки" readOnly value={memo} onFocus={e => e.target.select()}/>}
  </section>
}

