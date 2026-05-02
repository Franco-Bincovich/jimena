import { useEffect, useState } from 'react'
import { COLS, EstadoBadge, Skeleton, TipoBadge, formatDate } from '../components/HistorialUI'
import { useToast } from '../components/Toast'
import api from '../services/api'

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
      const haystack = [h.destinatario_email, h.destinatario_nombre, h.asunto].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <Toast />
      <div className="mb-6">
        <h1 className="text-text font-semibold text-xl md:text-2xl mb-0.5">Historial de envíos</h1>
        <p className="text-muted text-[12.5px]">Registro de todos los emails enviados desde el sistema</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-auto">
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
            <option value="all">Todos los tipos</option>
            <option value="pedido">Pedido</option>
            <option value="envio">Envío</option>
          </select>
        </div>
        <div className="w-full sm:flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por destinatario o asunto…" />
        </div>
      </div>

      <div className="bg-surface rounded-lg overflow-hidden" style={{ border: '0.5px solid #222' }}>
        <div style={{ overflowX: 'auto' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #222' }}>
              {COLS.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-muted-dark text-[11.5px] font-medium uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Skeleton />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted text-[12.5px]">
                  {items.length === 0 ? 'Todavía no hay envíos registrados' : 'Ningún envío coincide con los filtros aplicados'}
                </td>
              </tr>
            ) : (
              filtered.map((h) => (
                <tr key={h.id} className="hover:bg-surface-hover transition-colors" style={{ borderTop: '0.5px solid #222' }}>
                  <td className="px-4 py-3 text-muted text-[12px] whitespace-nowrap">{formatDate(h.created_at)}</td>
                  <td className="px-4 py-3"><TipoBadge tipo={h.tipo} /></td>
                  <td className="px-4 py-3">
                    <div className="text-text text-[12.5px]">{h.destinatario_nombre || h.destinatario_email}</div>
                    {h.destinatario_nombre && <div className="text-muted-dark text-[11.5px]">{h.destinatario_email}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted text-[12px]" title={h.asunto.length > 50 ? h.asunto : undefined}>
                    {h.asunto.length > 50 ? h.asunto.slice(0, 50) + '…' : h.asunto}
                  </td>
                  <td className="px-4 py-3"><EstadoBadge estado={h.estado} errorMsg={h.error_msg} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
