'use client'
import { useState } from 'react'
import { useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import { aboutIcons } from '../../../../src/about/icons'
import { Icon } from '../../../../src/about/Icon'

const AboutIconPicker: SelectFieldClientComponent = ({ path, readOnly }) => {
  const { value, setValue } = useField<string | null>({ path })
  const [query, search] = useState('')
  return <fieldset className="about-icon-picker" disabled={readOnly}>
    <legend>Иконка {value && <><Icon name={value} /> {value}</>}</legend>
    <input type="search" aria-label="Поиск иконки" placeholder="Поиск по названию" value={query} onChange={e => search(e.target.value)} />
    <div>{Object.keys(aboutIcons).filter(name => name.toLowerCase().includes(query.trim().toLowerCase())).map(name =>
      <button key={name} type="button" aria-pressed={value === name} onClick={() => setValue(name)}><Icon name={name} />{name}</button>)}</div>
    {value && <button type="button" onClick={() => setValue(null)}>Очистить выбор</button>}
  </fieldset>
}
export default AboutIconPicker
