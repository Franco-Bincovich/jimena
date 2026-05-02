import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { CAMBIAR_PASSWORD_ITEM, CONFIG_ITEM, NAV_SECTIONS, NavItem } from './SideNav'

export default function Layout({ children }) {
  const location = useLocation()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col flex-shrink-0 fixed top-0 left-0 bottom-0 z-30 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: '210px', backgroundColor: 'var(--c-sidebar)', borderRight: '0.5px solid var(--c-border-s)' }}
      >
        {/* Header */}
        <div className="px-4 py-5 flex items-start justify-between" style={{ borderBottom: '0.5px solid var(--c-border-s)' }}>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="flex items-center justify-center rounded" style={{ width: '22px', height: '22px', backgroundColor: '#FF6B00', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 2h8v7l-1.5-1L6.5 9 5 8 3.5 9 2 8l-.5.5V2z" fill="white" />
                </svg>
              </div>
              <span className="font-semibold text-text" style={{ fontSize: '13px' }}>Facturas</span>
            </div>
            <p className="text-muted-dark" style={{ fontSize: '11px', marginLeft: '34px' }}>Sistema interno</p>
          </div>
          {/* Close button — only on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden flex items-center justify-center text-muted-dark hover:text-muted transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px', minWidth: '44px', marginTop: '-8px', marginRight: '-8px' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-muted-dark px-3 mb-1 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.path} item={item} active={location.pathname === item.path} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Config — al fondo */}
        <div className="px-2 py-3" style={{ borderTop: '0.5px solid var(--c-border-s)' }}>
          <p className="text-muted-dark px-3 mb-1 uppercase tracking-wider" style={{ fontSize: '10px' }}>Sistema</p>
          <NavItem item={CONFIG_ITEM} active={location.pathname === CONFIG_ITEM.path} />
          <NavItem item={CAMBIAR_PASSWORD_ITEM} active={location.pathname === CAMBIAR_PASSWORD_ITEM.path} />
        </div>

        {/* Usuario + logout + toggle */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: '0.5px solid var(--c-border-s)' }}>
          <div className="flex-1 min-w-0">
            <p className="text-text truncate" style={{ fontSize: '12px', fontWeight: '500' }}>
              {user?.nombre || '—'}
            </p>
            <p className="text-muted-dark truncate" style={{ fontSize: '10px' }}>
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{ color: 'var(--c-muted-d)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            className="hover:text-muted transition-colors"
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.1" />
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11.5 8.5A5 5 0 015.5 2.5a5 5 0 100 9 5 5 0 006-3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{ color: 'var(--c-muted-d)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            className="hover:text-muted transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M9 4.5l2.5 2.5L9 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.5 7H5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4"
        style={{ height: '52px', backgroundColor: 'var(--c-sidebar)', borderBottom: '0.5px solid var(--c-border-s)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded" style={{ width: '22px', height: '22px', backgroundColor: '#FF6B00', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 2h8v7l-1.5-1L6.5 9 5 8 3.5 9 2 8l-.5.5V2z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-text" style={{ fontSize: '13px' }}>Facturas</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center text-muted hover:text-text transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}
          aria-label="Abrir menú"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto md:ml-[210px] p-4 md:p-7"
        style={{ backgroundColor: 'var(--c-bg)', minHeight: '100vh' }}
      >
        {/* Spacer for mobile fixed header */}
        <div className="md:hidden" style={{ height: '52px' }} />
        {children}
      </main>
    </div>
  )
}
