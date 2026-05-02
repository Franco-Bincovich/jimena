import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { saveSession } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/api/auth/login', { username, password })
      saveSession(data.access_token, { nombre: data.nombre, email: data.email })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'var(--c-input-bg)',
    border: '0.5px solid var(--c-input-border)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    color: 'var(--c-text)',
    outline: 'none',
    width: '100%',
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: 'var(--c-bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-8"
        style={{ backgroundColor: 'var(--c-sidebar)', border: '0.5px solid var(--c-border-s)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center rounded mb-3"
            style={{ width: '36px', height: '36px', backgroundColor: '#FF6B00' }}
          >
            <svg width="18" height="18" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 2h8v7l-1.5-1L6.5 9 5 8 3.5 9 2 8l-.5.5V2z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-text" style={{ fontSize: '15px' }}>Facturas</span>
          <span className="text-muted-dark" style={{ fontSize: '11px' }}>Sistema interno</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted" style={{ fontSize: '12px' }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-muted" style={{ fontSize: '12px' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: 'var(--c-error)' }}>{error}</p>
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
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
