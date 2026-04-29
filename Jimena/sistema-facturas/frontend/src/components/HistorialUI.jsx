const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export const COLS = ['Fecha', 'Tipo', 'Destinatario', 'Asunto', 'Estado']

export function formatDate(dateStr) {
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

export function TipoBadge({ tipo }) {
  return tipo === 'pedido' ? (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#2A1500', color: '#FF6B00', border: '0.5px solid #3A2000' }}>
      pedido
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}>
      envío
    </span>
  )
}

export function EstadoBadge({ estado, errorMsg }) {
  return estado === 'enviado' ? (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}>
      enviado
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium cursor-help" style={{ backgroundColor: '#2A0F0F', color: '#E07070', border: '0.5px solid #4A1E1E' }} title={errorMsg || 'Error desconocido'}>
      error
    </span>
  )
}

export function Skeleton() {
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
