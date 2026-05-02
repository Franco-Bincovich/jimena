export function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

export function IconDrive() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M6.5 1L1 10.5l3 5h10l3-5L12.5 1H6.5z" fill="none" stroke="#4285F4" strokeWidth="1.2" />
      <path d="M1 10.5h16M6.5 1l4 9.5M12.5 1l-4 9.5" stroke="#4285F4" strokeWidth="1.1" />
    </svg>
  )
}

export function IconSheets() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="1" width="14" height="16" rx="1.5" stroke="#34A853" strokeWidth="1.2" />
      <path d="M5 6h8M5 9h8M5 12h5" stroke="#34A853" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="13" rx="1" stroke="#888" strokeWidth="1.2" />
      <path d="M6 17V9h6v8M9 1v3" stroke="#888" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="5" y="6.5" width="2" height="2" rx=".3" fill="#888" />
      <rect x="11" y="6.5" width="2" height="2" rx=".3" fill="#888" />
    </svg>
  )
}

export function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="6" r="3" stroke="#888" strokeWidth="1.2" />
      <path d="M1 15.5c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13 8.5c1.7 0 3 1.3 3 3v2.5" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="14" cy="5.5" r="2" stroke="#888" strokeWidth="1.2" />
    </svg>
  )
}

export function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill="var(--c-ok-bg)" stroke="var(--c-ok-border)" strokeWidth="1" />
      <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="var(--c-ok-text)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill="var(--c-warn-bg)" stroke="var(--c-warn-border)" strokeWidth="1" />
      <path d="M7 4.5v3M7 9.5v.5" stroke="var(--c-warn-text)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5" style={{ borderBottom: '0.5px solid var(--c-border)', paddingBottom: '14px' }}>
      {icon}
      <h2 className="text-text text-[13.5px] font-medium">{title}</h2>
    </div>
  )
}

export function InstruccionBox({ children }) {
  return (
    <div className="rounded-md p-3 mb-4 text-[12.5px] leading-relaxed" style={{ backgroundColor: 'var(--c-border-s)', borderLeft: '2px solid #FF6B00', color: 'var(--c-muted)' }}>
      {children}
    </div>
  )
}

export function VerifyBadge({ status }) {
  if (status === 'ok') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px]" style={{ backgroundColor: 'var(--c-ok-bg)', color: 'var(--c-ok-text)', border: '0.5px solid var(--c-ok-border)' }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Verificado
    </span>
  )
  if (status === 'error') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px]" style={{ backgroundColor: 'var(--c-error-bg)', color: 'var(--c-error)', border: '0.5px solid var(--c-border-l)' }}>Sin acceso</span>
  )
  return null
}

export function Spinner({ white }) {
  return (
    <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0" style={white ? { borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' } : { borderColor: 'var(--c-border-l)', borderTopColor: 'var(--c-muted)' }} />
  )
}

export const SHEET_COLS = [
  'Fecha', 'Hora', 'Tipo', 'Proyecto', 'CUIT', 'Mes/Año',
  'Proveedor', 'Consumos API', 'Factura', 'Link Drive',
  'Monto', 'Estado', 'Email Destinatario',
]
