'use client'

import { useEffect, useRef, useState } from 'react'
import './chat.css'

type Message = { id: number, author: 'visitor' | 'operator', text: string, createdAt: string }
const messageLimit = 2000
const contactLimit = 254
const time = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' })
const post = (action: string, data: object) => fetch('/api/chat/' + action, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  signal: AbortSignal.timeout(15000),
})

function isValidContact(contact: string) {
  if (contact.length > contactLimit || contact.includes('\0')) return false
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return true
  const digits = contact.replace(/\D/g, '')
  return /^\+?[\d ().-]+$/.test(contact) && digits.length >= 7 && digits.length <= 15
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [ready, setReady] = useState(false)
  const [closed, setClosed] = useState(false)
  const [draft, setDraft] = useState('')
  const [contact, setContact] = useState('')
  const [busy, setBusy] = useState(false)
  const [readError, setReadError] = useState('')
  const [sendError, setSendError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const cursor = useRef(0)
  const pending = useRef<{text: string, key: string} | null>(null)
  const sending = useRef(false)
  const launcher = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const log = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let alive = true
    let fetching = false
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    async function poll() {
      clearTimeout(timer)
      if (!alive || document.hidden || fetching) return
      fetching = true
      let delay = 2500
      try {
        const result = await fetch('/api/chat/messages?after=' + cursor.current, {
          cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        })
        if (!alive) return
        if (result.status === 401) {
          const ensure = async () => {
            if (!alive) return
            const created = await post('session', {})
            if (!created.ok) throw new Error()
          }
          if (navigator.locks) await navigator.locks.request('remember-chat-session', ensure)
          else await ensure()
          if (!alive) return
          cursor.current = 0
          setMessages([])
          delay = 0
        } else {
          if (!result.ok) { if (result.status === 429) delay = 60000; throw new Error() }
          const data: { messages: Message[], closed: boolean } = await result.json()
          if (!alive) return
          if (data.messages.length) {
            cursor.current = data.messages[data.messages.length - 1].id
            setMessages(previous => [...previous, ...data.messages])
            if (data.messages.length === 100) delay = 0
          }
          setReady(true)
          setClosed(data.closed)
        }
        setReadError('')
      } catch {
        if (alive) setReadError('Не удалось загрузить переписку. Пробуем ещё раз.')
        delay = Math.max(delay, 5000)
      } finally {
        fetching = false
        if (alive && !document.hidden) timer = setTimeout(poll, delay)
      }
    }
    void poll()
    document.addEventListener('visibilitychange', poll)
    return () => { alive = false; clearTimeout(timer); controller.abort(); document.removeEventListener('visibilitychange', poll) }
  }, [open, refresh])

  useEffect(() => { if (open) closeButton.current?.focus() }, [open])
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight }, [messages, open])

  function close() { setOpen(false); launcher.current?.focus() }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const question = draft.trim()
    if (sending.current || !question || !ready || closed) return
    const replyContact = contact.trim()
    if (!isValidContact(replyContact)) {
      setSendError('Укажите телефон или email в корректном формате.')
      return
    }
    const contactLine = `\n\nКонтакт для ответа: ${replyContact}`
    const text = question + contactLine
    if (text.length > messageLimit) {
      setSendError(`Сократите вопрос до ${messageLimit - contactLine.length} символов, чтобы добавить контакт.`)
      return
    }
    sending.current = true
    setBusy(true)
    setSendError('')
    if (pending.current?.text !== text) pending.current = { text, key: crypto.randomUUID() }
    try {
      const response = await post('messages', pending.current)
      if (!response.ok) throw new Error(response.status === 429 ? 'Слишком много сообщений. Попробуйте через минуту.' : 'Не удалось подтвердить отправку. Повторите попытку.')
      pending.current = null
      setDraft('')
    } catch (e) {
      setSendError(e instanceof Error && e.message.startsWith('Слишком') ? e.message : 'Не удалось подтвердить отправку. Повторите попытку.')
    } finally {
      sending.current = false
      setBusy(false)
      setRefresh(value => value + 1)
    }
  }

  return <aside className="site-chat" aria-label="Чат со специалистом">
    {open && <section id="site-chat-panel" role="dialog" aria-labelledby="site-chat-title" onKeyDown={e => { if (e.key === 'Escape') close() }}>
      <div className="chat-heading"><h2 id="site-chat-title">Чат со специалистом</h2><button ref={closeButton} onClick={close} aria-label="Закрыть чат">×</button></div>
      <div className="chat-history" ref={log} role="log" aria-label="История сообщений" aria-live="polite">
        <p className="chat-bubble">Здравствуйте! Мы готовы помочь вам. Напишите ваш вопрос, и наш специалист ответит в ближайшее время</p>
        {messages.map(m => <div className={'chat-bubble ' + (m.author === 'visitor' ? 'chat-outgoing' : '')} key={m.id}>
          <small>{m.author === 'visitor' ? 'Вы' : 'Специалист'} · <time dateTime={m.createdAt}>{time.format(new Date(m.createdAt))}</time></small>{m.text}
        </div>)}
      </div>
      <form onSubmit={submit}>
        <div role="status">{sendError || readError || (closed ? 'Диалог закрыт.' : !ready ? 'Загружаем переписку…' : '')}</div>
        <label htmlFor="chat-question">Ваш вопрос</label>
        <textarea id="chat-question" maxLength={messageLimit} rows={2} value={draft} disabled={busy || closed} onChange={e => setDraft(e.target.value)} />
        <label htmlFor="chat-contact">Телефон или email (обязательно)</label>
        <input id="chat-contact" type="text" required maxLength={contactLimit} autoCapitalize="none" spellCheck={false} value={contact} disabled={busy || closed} onChange={e => setContact(e.target.value)} />
        <button className="btn" disabled={!ready || busy || closed || !draft.trim() || !contact.trim()}>{busy ? 'Отправляем…' : 'Отправить'}</button>
      </form>
    </section>}
    <button className="chat-launcher" ref={launcher} aria-expanded={open} aria-controls={open ? 'site-chat-panel' : undefined} onClick={() => open ? close() : setOpen(true)}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.5 11a8.5 8.5 0 0 1-8.5 8c-1.3 0-2.6-.2-3.7-.7L3 20l1.5-4.5A8 8 0 0 1 3.5 11a8.5 8.5 0 0 1 17 0Z"/><path d="M8 10h8m-8 3h5"/></svg>
      Чат
    </button>
  </aside>
}
