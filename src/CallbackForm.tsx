'use client'
import Link from 'next/link'
import { useState } from 'react'

export function CallbackForm({ source = '/contacts#callback', id, feedback = false }: { source?: string; id?: string; feedback?: boolean }) {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      if (!response.ok) throw new Error('Lead submission failed')
      setSent(true)
      form.reset()
    } catch {
      setError('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  return <form id={id} className="callback" onSubmit={submitLead}>
    {feedback ? <h2>Обратная связь</h2> : <><span>Обратная связь</span><h2>Заказать звонок</h2></>}
    <p>Оставьте номер — специалист свяжется с вами для консультации.</p>
    <label>Ваше имя<input name="name" required maxLength={120} placeholder="Как к вам обращаться"/></label>
    <label>Телефон<input name="phone" type="tel" required maxLength={40} placeholder="+7 (___) ___-__-__"/></label>
    <div className="lead-honeypot" hidden aria-hidden="true">
      <label>Оставьте это поле пустым<input name="website" tabIndex={-1} autoComplete="off"/></label>
    </div>
    <input type="hidden" name="requestType" value="callback"/>
    <input type="hidden" name="source" value={source}/>
    <label className="consent"><input type="checkbox" name="personalDataConsent" value="true" required/> <span>Согласен на обработку персональных данных в соответствии с <Link href="/legal">политикой конфиденциальности</Link></span></label>
    <button className="btn" type="submit" disabled={submitting || sent}>
      {submitting ? 'Отправка…' : sent ? 'Заявка отправлена' : 'Заказать звонок'}
    </button>
    {sent && <p className="success" role="status">Спасибо! Заявка сохранена, специалист свяжется с вами.</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </form>
}
