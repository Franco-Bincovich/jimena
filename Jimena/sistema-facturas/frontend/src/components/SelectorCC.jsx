import { useEffect, useState } from 'react'
import api from '../services/api'

export default function SelectorCC({ value, onChange }) {
  const [contactos, setContactos] = useState([])
  const [emailExtra, setEmailExtra] = useState('')

  useEffect(() => {
    api.get('/api/contactos-cc').then(setContactos).catch(() => {})
  }, [])

  const toggleContacto = (email) => {
    if (value.includes(email)) {
      onChange(value.filter((e) => e !== email))
    } else {
      onChange([...value, email])
    }
  }

  const addEmailExtra = () => {
    const trimmed = emailExtra.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setEmailExtra('')
  }

  const removeEmail = (email) => onChange(value.filter((e) => e !== email))

  // Emails adicionales (no están en la lista de contactos fijos)
  const emailsContactos = contactos.map((c) => c.email)
  const emailsAdicionales = value.filter((e) => !emailsContactos.includes(e))

  return (
    <div className="flex flex-col gap-3">

      {/* Contactos fijos */}
      {contactos.length > 0 && (
        <div
          className="rounded-md p-3"
          style={{ backgroundColor: '#141414', border: '0.5px solid #2A2A2A' }}
        >
          {contactos.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2.5 py-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(c.email)}
                onChange={() => toggleContacto(c.email)}
                style={{ width: 'auto', flexShrink: 0 }}
              />
              <span className="text-text text-[12.5px]">{c.nombre}</span>
              <span className="text-muted-dark text-[12px]">— {c.email}</span>
            </label>
          ))}
        </div>
      )}

      {/* Emails adicionales como badges */}
      {emailsAdicionales.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emailsAdicionales.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px]"
              style={{ backgroundColor: '#1E1E1E', border: '0.5px solid #2A2A2A', color: '#888' }}
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="hover:text-error transition-colors"
                style={{ lineHeight: 1 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input para email adicional */}
      <div className="flex gap-2">
        <input
          type="email"
          value={emailExtra}
          onChange={(e) => setEmailExtra(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmailExtra())}
          placeholder="Agregar email adicional…"
          className="flex-1"
        />
        <button
          type="button"
          onClick={addEmailExtra}
          disabled={!emailExtra.trim()}
          className="px-3 py-1.5 text-muted hover:text-text text-[12px] rounded-md transition-colors disabled:opacity-40 flex-shrink-0"
          style={{ border: '0.5px solid #2A2A2A' }}
        >
          + Agregar
        </button>
      </div>

    </div>
  )
}
