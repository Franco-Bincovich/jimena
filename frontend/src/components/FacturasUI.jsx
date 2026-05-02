import { Link } from 'react-router-dom'

export const EMPTY_FORM = {
  proveedor_id: '', numero_factura: '', fecha_factura: '',
  fecha_desde: '', fecha_hasta: '', monto_total: '', descripcion: '', cliente_ids: [],
}

export const fmtFecha = (s) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export const fmtMonto = (v) =>
  v != null
    ? `$ ${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'

export const toInputDate = (s) => {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
}

export const fromInputDate = (v) => {
  if (!v) return undefined
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

export function PendienteBadge() {
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap" style={{ backgroundColor: '#1E1800', color: '#D4920A', border: '0.5px solid #3A3000' }}>
      Pendiente de confirmar
    </span>
  )
}

export function EstadoBadge({ estado, driveUrl }) {
  if (estado === 'confirmada') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}>
        Confirmada
        {driveUrl && (
          <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100" title="Ver en Drive">↗</a>
        )}
      </span>
    )
  }
  return <PendienteBadge />
}

export function Spinner() {
  return <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
}

export function CardSkeleton() {
  return Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="bg-surface rounded-lg p-4 animate-pulse" style={{ border: '0.5px solid #222' }}>
      <div className="h-3.5 bg-surface-hover rounded w-52 mb-3" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((j) => <div key={j} className="h-3 bg-surface-hover rounded" />)}
      </div>
    </div>
  ))
}

export function TableSkeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <tr key={i} style={{ borderTop: '0.5px solid #222' }}>
      {[52, 30, 22, 18, 20, 18, 14].map((w, j) => (
        <td key={j} className="px-3 py-3">
          <div className="h-3 rounded animate-pulse bg-surface-hover" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  ))
}

export function GmailBuscarSection({ googleConnected, searching, handleBuscar }) {
  return (
    <div className="p-4 bg-surface rounded-lg mb-6" style={{ border: '0.5px solid #222' }}>
      <p className="text-text text-[13px] font-medium mb-1">Buscar facturas nuevas</p>
      <p className="text-muted text-[12px] mb-4">Escanea la bandeja de Gmail y detecta emails con facturas adjuntas como PDF.</p>
      {googleConnected === false ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md text-[12.5px]" style={{ backgroundColor: '#1E1800', border: '0.5px solid #3A3000', color: '#D4920A' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Conectá tu cuenta de Google en{' '}
          <Link to="/configuracion" className="underline hover:opacity-80 transition-opacity">Configuración</Link>
          {' '}para usar esta función.
        </div>
      ) : (
        <button onClick={handleBuscar} disabled={searching || googleConnected === null} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[40px]">
          {searching ? (
            <><Spinner /> Buscando en Gmail...</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.1" /><path d="M1 4.5l6 4 6-4" stroke="white" strokeWidth="1.1" strokeLinejoin="round" /></svg> Buscar facturas nuevas en Gmail</>
          )}
        </button>
      )}
    </div>
  )
}

export function FacturasTodasTab({ loading, todas, setDeleteModal }) {
  return (
    <div className="bg-surface rounded-lg overflow-hidden" style={{ border: '0.5px solid #222' }}>
      <div style={{ overflowX: 'auto' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '0.5px solid #222' }}>
            {['Archivo', 'Proveedor', 'N° Factura', 'Fecha', 'Monto', 'Estado', 'Acciones'].map((col) => (
              <th key={col} className="px-3 py-3 text-left text-muted-dark text-[11.5px] font-medium uppercase tracking-wider whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? <TableSkeleton /> : todas.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-muted text-[12.5px]">No hay facturas cargadas todavía</td></tr>
          ) : todas.map((f) => (
            <tr key={f.id} className="hover:bg-surface-hover transition-colors" style={{ borderTop: '0.5px solid #222' }}>
              <td className="px-3 py-3"><code className="text-primary text-[11.5px]">{f.nombre_archivo}</code></td>
              <td className="px-3 py-3 text-muted text-[12px]">{f.proveedor?.nombre || '—'}</td>
              <td className="px-3 py-3 text-muted text-[12px] font-mono">{f.numero_factura || '—'}</td>
              <td className="px-3 py-3 text-muted text-[12px] whitespace-nowrap">{fmtFecha(f.fecha_factura)}</td>
              <td className="px-3 py-3 text-muted text-[12px] whitespace-nowrap">{fmtMonto(f.monto_total)}</td>
              <td className="px-3 py-3"><EstadoBadge estado={f.estado} driveUrl={f.drive_url} /></td>
              <td className="px-3 py-3">
                <button onClick={() => setDeleteModal({ open: true, factura: f, mode: 'delete' })} className="px-2.5 py-1.5 text-error hover:opacity-80 text-[12px] rounded transition-colors min-h-[36px]">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
