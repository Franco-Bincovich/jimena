import { useEffect, useState } from 'react'
import { useToast } from '../components/Toast'
import api from '../services/api'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yestStart = new Date(todayStart.getTime() - 86400000)
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (dStart >= todayStart) return `Hoy ${hhmm}`
  if (dStart >= yestStart) return `Ayer ${hhmm}`
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function TipoBadge({ tipo }) {
  return tipo === 'pedido' ? (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: '#2A1500', color: '#FF6B00', border: '0.5px solid #3A2000' }}
    >
      pedido
    </span>
  ) : (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}
    >
      envío
    </span>
  )
}

function EstadoBadge({ estado, errorMsg }) {
  return estado === 'enviado' ? (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}
    >
      enviado
    </span>
  ) : (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-medium cursor-help"
      style={{ backgroundColor: '#2A0F0F', color: '#E07070', border: '0.5px solid #4A1E1E' }}
      title={errorMsg || 'Error desconocido'}
    >
      error
    </span>
  )
}

const COLS = ['Fecha', 'Tipo', 'Destinatario', 'Asunto', 'Estado']

function Skeleton() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} style={{ borderTop: '0.5px solid #222' }}>
      {COLS.map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-3 rounded animate-pulse bg-surface-hover" style={{ width: '70%' }} />
        </td>
      ))}
    </tr>
  ))
}

export default function Historial() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { showToast, Toast } = useToast()

  useEffect(() => {
    api.get('/api/historial')
      .then(setItems)
      .catch(() => showToast('No se pudo cargar el historial', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((h) => {
    if (tipoFilter !== 'all' && h.tipo !== tipoFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const haystack = [h.destinatario_email, h.destinatario_nombre, h.asunto]
        .filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <Toast />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-text font-semibold text-[15px] mb-0.5">Historial de envíos</h1>
        <p className="text-muted text-[12.5px]">Registro de todos los emails enviados desde el sistema</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <div style={{ width: '170px' }}>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
            <option value="all">Todos los tipos</option>
            <option value="pedido">Pedido</option>
            <option value="envio">Envío</option>
          </select>
        </div>
        <div style={{ width: '300px' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por destinatario o asunto…"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-lg overflow-hidden" style={{ border: '0.5px solid #222' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #222' }}>
              {COLS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-muted-dark text-[11.5px] font-medium uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Skeleton />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted text-[12.5px]">
                  {items.length === 0
                    ? 'Todavía no hay envíos registrados'
                    : 'Ningún envío coincide con los filtros aplicados'}
                </td>
              </tr>
            ) : (
              filtered.map((h) => (
                <tr
                  key={h.id}
                  className="hover:bg-surface-hover transition-colors"
                  style={{ borderTop: '0.5px solid #222' }}
                >
                  <td className="px-4 py-3 text-muted text-[12px] whitespace-nowrap">
                    {formatDate(h.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <TipoBadge tipo={h.tipo} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text text-[12.5px]">
                      {h.destinatario_nombre || h.destinatario_email}
                    </div>
                    {h.destinatario_nombre && (
                      <div className="text-muted-dark text-[11.5px]">{h.destinatario_email}</div>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-muted text-[12px]"
                    title={h.asunto.length > 50 ? h.asunto : undefined}
                  >
                    {h.asunto.length > 50 ? h.asunto.slice(0, 50) + '…' : h.asunto}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={h.estado} errorMsg={h.error_msg} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
