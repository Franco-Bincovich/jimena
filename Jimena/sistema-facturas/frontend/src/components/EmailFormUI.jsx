import { Link } from 'react-router-dom'

export function SectionLabel({ n, children }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#FF6B00' }}>
      {n} — {children}
    </p>
  )
}

export function Spinner() {
  return (
    <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
  )
}

export function AdjuntoBadge({ factura }) {
  if (!factura) return null
  const badge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono" style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 10.5L8.5 4a2 2 0 00-2.83-2.83L1.17 5.67A3 3 0 005.41 9.91L9 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      {factura.nombre_archivo}
    </span>
  )
  if (factura.drive_url) {
    return <a href={factura.drive_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">{badge}</a>
  }
  return badge
}

export function GoogleWarning() {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-md text-[12.5px] mb-5" style={{ backgroundColor: '#1E1800', border: '0.5px solid #3A3000', color: '#D4920A' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      Conectá tu cuenta de Google en{' '}
      <Link to="/configuracion" className="underline hover:opacity-80 transition-opacity">Configuración</Link>
      {' '}para poder enviar emails.
    </div>
  )
}
