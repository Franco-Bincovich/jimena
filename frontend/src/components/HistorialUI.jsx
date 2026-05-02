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
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: 'var(--c-warn-bg)', color: 'var(--c-warn-text)', border: '0.5px solid var(--c-warn-border)' }}>
      pedido
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: 'var(--c-ok-bg)', color: 'var(--c-ok-text)', border: '0.5px solid var(--c-ok-border)' }}>
      envío
    </span>
  )
}

export function EstadoBadge({ estado, errorMsg }) {
  return estado === 'enviado' ? (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: 'var(--c-ok-bg)', color: 'var(--c-ok-text)', border: '0.5px solid var(--c-ok-border)' }}>
      enviado
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium cursor-help" style={{ backgroundColor: 'var(--c-error-bg)', color: 'var(--c-error)', border: '0.5px solid var(--c-border-l)' }} title={errorMsg || 'Error desconocido'}>
      error
    </span>
  )
}

export function Skeleton() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} style={{ borderTop: '0.5px solid var(--c-border)' }}>
      {COLS.map((c) => (
        <td key={c} className="px-4 py-3">
          <div className="h-3 rounded animate-pulse bg-surface-hover" style={{ width: '70%' }} />
        </td>
      ))}
    </tr>
  ))
}
