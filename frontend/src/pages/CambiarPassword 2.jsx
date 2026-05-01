import { useState } from 'react'
import api from '../services/api'

export default function CambiarPassword() {
  const [form, setForm] = useState({
    password_actual: '',
    password_nuevo: '',
    confirmar: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.password_nuevo !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.password_nuevo.length < 8) {
      setError('La contraseña nueva debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        password_actual: form.password_actual,
        password_nuevo: form.password_nuevo,
      })
      setSuccess(true)
      setForm({ password_actual: '', password_nuevo: '', confirmar: '' })
    } catch (err) {
      setError(err?.message || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: '#111111',
    border: '0.5px solid #2A2A2A',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#E5E5E5',
    outline: 'none',
    width: '100%',
  }

  return (
    <div>
      <h1 className="font-semibold text-text mb-6" style={{ fontSize: '17px' }}>
        Cambiar contraseña
      </h1>

      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: '#0A0A0A', border: '0.5px solid #1A1A1A', maxWidth: '400px' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '12px', color: '#888' }}>Contraseña actual</label>
            <input
              type="password"
              name="password_actual"
              value={form.password_actual}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '12px', color: '#888' }}>Contraseña nueva</label>
            <input
              type="password"
              name="password_nuevo"
              value={form.password_nuevo}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '12px', color: '#888' }}>Confirmar contraseña nueva</label>
            <input
              type="password"
              name="confirmar"
              value={form.confirmar}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          {error && <p style={{ fontSize: '12px', color: '#FF4D4D' }}>{error}</p>}
          {success && (
            <p style={{ fontSize: '12px', color: '#4CAF50' }}>Contraseña actualizada correctamente</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#CC5500' : '#FF6B00',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '9px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
          >
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
