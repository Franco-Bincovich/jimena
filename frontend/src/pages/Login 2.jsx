import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { saveSession } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/api/auth/login', { email, password })
      saveSession(data.access_token, { nombre: data.nombre, email: data.email })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: '#111111' }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-8"
        style={{ backgroundColor: '#0A0A0A', border: '0.5px solid #1A1A1A' }}
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
          <span className="font-semibold text-white" style={{ fontSize: '15px' }}>Facturas</span>
          <span style={{ fontSize: '11px', color: '#555' }}>Sistema interno</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '12px', color: '#888' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                backgroundColor: '#111111',
                border: '0.5px solid #2A2A2A',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#E5E5E5',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '12px', color: '#888' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                backgroundColor: '#111111',
                border: '0.5px solid #2A2A2A',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#E5E5E5',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#FF4D4D' }}>{error}</p>
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
