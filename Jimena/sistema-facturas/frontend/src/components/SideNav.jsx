import { useNavigate } from 'react-router-dom'

export const NAV_SECTIONS = [
  {
    label: 'Acciones',
    items: [
      {
        path: '/pedir-factura',
        label: 'Pedir factura',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.1" />
            <path d="M4 6.5h5M6.5 4v5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/enviar-factura',
        label: 'Enviar a cliente',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1.5 2.5l10 4-10 4V8l7-1.5L1.5 5V2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Maestros',
    items: [
      {
        path: '/proveedores',
        label: 'Proveedores',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="4" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M4 4V3a2.5 2.5 0 015 0v1" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        ),
      },
      {
        path: '/clientes',
        label: 'Clientes',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M1.5 11.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/plantillas',
        label: 'Plantillas',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.1" />
            <path d="M3.5 4.5h6M3.5 6.5h6M3.5 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/facturas',
        label: 'Facturas recibidas',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 1.5h9v10l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1L2 11.5V1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M4.5 5h4M4.5 7h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Registro',
    items: [
      {
        path: '/historial',
        label: 'Historial de envíos',
        icon: (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
  },
]

export const CONFIG_ITEM = {
  path: '/configuracion',
  label: 'Configuración',
  icon: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6.5 1.5v1M6.5 10.5v1M1.5 6.5h1M10.5 6.5h1M3.4 3.4l.7.7M8.9 8.9l.7.7M3.4 9.6l.7-.7M8.9 4.1l.7-.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  ),
}

export const CAMBIAR_PASSWORD_ITEM = {
  path: '/cambiar-password',
  label: 'Cambiar contraseña',
  icon: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="2" y="5.5" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4.5 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  ),
}

export function NavItem({ item, active }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(item.path)}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-left transition-colors ${
        active ? 'bg-surface-hover text-text' : 'text-muted-dark hover:text-muted'
      }`}
    >
      <span className={active ? 'text-text' : 'text-muted-dark'}>{item.icon}</span>
      <span style={{ fontSize: '12.5px' }}>{item.label}</span>
    </button>
  )
}
