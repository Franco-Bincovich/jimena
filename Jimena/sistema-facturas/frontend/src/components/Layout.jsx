import { useLocation } from 'react-router-dom'
import { CONFIG_ITEM, NAV_SECTIONS, NavItem } from './SideNav'

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      <aside
        className="flex flex-col flex-shrink-0"
        style={{ width: '210px', backgroundColor: '#0A0A0A', borderRight: '0.5px solid #1A1A1A', position: 'fixed', top: 0, left: 0, bottom: 0 }}
      >
        {/* Header */}
        <div className="px-4 py-5" style={{ borderBottom: '0.5px solid #1A1A1A' }}>
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
        <div className="px-2 py-3" style={{ borderTop: '0.5px solid #1A1A1A' }}>
          <p className="text-muted-dark px-3 mb-1 uppercase tracking-wider" style={{ fontSize: '10px' }}>Sistema</p>
          <NavItem item={CONFIG_ITEM} active={location.pathname === CONFIG_ITEM.path} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ marginLeft: '210px', backgroundColor: '#111111', minHeight: '100vh', padding: '28px' }}>
        {children}
      </main>
    </div>
  )
}
