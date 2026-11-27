'use client'
import { useId, useRef } from 'react'
import { CallbackForm } from '../CallbackForm'

export function CallbackButton({ label, secondary = false }: { label: string; secondary?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  return <>
    <button ref={trigger} type="button" className={secondary ? 'btn btn-secondary' : 'btn'} aria-haspopup="dialog" aria-controls={id}
      onClick={() => dialog.current?.showModal()}>{label}</button>
    <dialog ref={dialog} id={id} aria-label="Заказать звонок" className="about-dialog" onClose={() => trigger.current?.focus()}>
      <button type="button" className="about-close" aria-label="Закрыть форму" onClick={() => dialog.current?.close()}>×</button>
      <CallbackForm source="/about" heading="Заказать звонок" />
    </dialog>
  </>
}
