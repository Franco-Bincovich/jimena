import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import api from '../services/api'

// ── Iconos ─────────────────────────────────────────────────────────────────

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function IconDrive() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M6.5 1L1 10.5l3 5h10l3-5L12.5 1H6.5z" fill="none" stroke="#4285F4" strokeWidth="1.2" />
      <path d="M1 10.5h16M6.5 1l4 9.5M12.5 1l-4 9.5" stroke="#4285F4" strokeWidth="1.1" />
    </svg>
  )
}

function IconSheets() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="1" width="14" height="16" rx="1.5" stroke="#34A853" strokeWidth="1.2" />
      <path d="M5 6h8M5 9h8M5 12h5" stroke="#34A853" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="13" rx="1" stroke="#888" strokeWidth="1.2" />
      <path d="M6 17V9h6v8M9 1v3" stroke="#888" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="5" y="6.5" width="2" height="2" rx=".3" fill="#888" />
      <rect x="11" y="6.5" width="2" height="2" rx=".3" fill="#888" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="6" r="3" stroke="#888" strokeWidth="1.2" />
      <path d="M1 15.5c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13 8.5c1.7 0 3 1.3 3 3v2.5" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="14" cy="5.5" r="2" stroke="#888" strokeWidth="1.2" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill="#0A2A0A" stroke="#1A4A1A" strokeWidth="1" />
      <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#5CB85C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" fill="#1E1800" stroke="#3A3000" strokeWidth="1" />
      <path d="M7 4.5v3M7 9.5v.5" stroke="#D4920A" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ── Componentes de estructura ──────────────────────────────────────────────

function CardHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5 mb-5" style={{ borderBottom: '0.5px solid #222', paddingBottom: '14px' }}>
      {icon}
      <h2 className="text-text text-[13.5px] font-medium">{title}</h2>
    </div>
  )
}

function InstruccionBox({ children }) {
  return (
    <div
      className="rounded-md p-3 mb-4 text-[12.5px] leading-relaxed"
      style={{
        backgroundColor: '#1A1A1A',
        borderLeft: '2px solid #FF6B00',
        color: '#888',
      }}
    >
      {children}
    </div>
  )
}

function VerifyBadge({ status }) {
  if (status === 'ok') return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px]"
      style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verificado
    </span>
  )
  if (status === 'error') return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px]"
      style={{ backgroundColor: '#2A0F0F', color: '#E07070', border: '0.5px solid #4A1E1E' }}
    >
      Sin acceso
    </span>
  )
  return null
}

function Spinner({ white }) {
  return (
    <div
      className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0"
      style={
        white
          ? { borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }
          : { borderColor: '#333', borderTopColor: '#888' }
      }
    />
  )
}

// ── Columnas del Sheet ─────────────────────────────────────────────────────

const SHEET_COLS = [
  'Fecha', 'Hora', 'Tipo', 'Proyecto', 'CUIT', 'Mes/Año',
  'Proveedor', 'Consumos API', 'Factura', 'Link Drive',
  'Monto', 'Estado', 'Email Destinatario',
]

// ── Principal ──────────────────────────────────────────────────────────────

export default function Configuracion() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast, Toast } = useToast()

  const [loading, setLoading] = useState(true)

  // Sección 1 — Google
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleNotConfigured, setGoogleNotConfigured] = useState(false)
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Sección 2 — Drive
  const [driveFolderId, setDriveFolderId] = useState('')
  const [driveVerifyStatus, setDriveVerifyStatus] = useState(null) // null | 'ok' | 'error'
  const [driveVerifyMsg, setDriveVerifyMsg] = useState('')
  const [verifyingDrive, setVerifyingDrive] = useState(false)

  // Sección 3 — Sheets
  const [sheetsTab, setSheetsTab] = useState('existing') // 'existing' | 'new'
  const [sheetId, setSheetId] = useState('')
  const [sheetVerifyStatus, setSheetVerifyStatus] = useState(null)
  const [verifyingSheet, setVerifyingSheet] = useState(false)
  const [creatingSheet, setCreatingSheet] = useState(false)
  const [createdSheetId, setCreatedSheetId] = useState('')
  const [createdSheetUrl, setCreatedSheetUrl] = useState('')

  // Sección 4 — Contactos CC
  const [contactosCC, setContactosCC] = useState([])
  const [ccModalOpen, setCcModalOpen] = useState(false)
  const [ccNombre, setCcNombre] = useState('')
  const [ccEmail, setCcEmail] = useState('')
  const [savingCC, setSavingCC] = useState(false)
  const [deletingCC, setDeletingCC] = useState(null)

  // Sección 5 — Empresa
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaEmail, setEmpresaEmail] = useState('')
  const [savingEmpresa, setSavingEmpresa] = useState(false)

  // ── Leer query params (?connected=true / ?error=oauth_failed) ─────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('connected') === 'true') {
      showToast('¡Google conectado correctamente!')
    } else if (params.get('error') === 'oauth_failed') {
      showToast('No se pudo conectar con Google. Intentá de nuevo.', 'error')
    }
    if (params.has('connected') || params.has('error')) {
      navigate('/configuracion', { replace: true })
    }
  }, [])

  // ── Cargar config inicial ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.get('/api/config'), api.get('/api/contactos-cc')])
      .then(([cfg, ccs]) => {
        setGoogleConnected(!!cfg.connected)
        setGoogleEmail(cfg.google_email || '')
        setDriveFolderId(cfg.drive_folder_id || '')
        setSheetId(cfg.sheet_id || '')
        setEmpresaNombre(cfg.empresa_nombre || '')
        setEmpresaEmail(cfg.empresa_email || '')
        if (cfg.drive_folder_id) setDriveVerifyStatus('ok')
        if (cfg.sheet_id) setSheetVerifyStatus('ok')
        setContactosCC(ccs)
      })
      .catch(() => showToast('Error al cargar la configuración', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // ── Estado general ────────────────────────────────────────────────────────
  const checks = [
    { key: 'google', label: 'Conectá tu cuenta de Google', done: googleConnected },
    { key: 'drive', label: 'Configurá la carpeta de Drive', done: driveVerifyStatus === 'ok' },
    { key: 'sheet', label: 'Configurá el Sheet de registro', done: sheetVerifyStatus === 'ok' },
    { key: 'empresa', label: 'Completá los datos de la empresa', done: !!empresaNombre.trim() },
  ]
  const allDone = checks.every((c) => c.done)

  // ── Google ────────────────────────────────────────────────────────────────

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true)
    try {
      const res = await api.get('/api/auth/google/url')
      window.location.href = res.url
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONFIGURED') {
        setGoogleNotConfigured(true)
      } else {
        showToast(err?.message || 'Error al obtener la URL de autorización', 'error')
      }
      setConnectingGoogle(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await api.post('/api/auth/google/disconnect')
      setGoogleConnected(false)
      setGoogleEmail('')
      showToast('Cuenta de Google desconectada')
    } catch (err) {
      showToast(err?.message || 'Error al desconectar', 'error')
    } finally {
      setDisconnecting(false)
      setDisconnectOpen(false)
    }
  }

  // ── Drive ─────────────────────────────────────────────────────────────────

  const handleVerifyDrive = async () => {
    if (!driveFolderId.trim()) return showToast('Ingresá el ID de la carpeta', 'error')
    setVerifyingDrive(true)
    setDriveVerifyStatus(null)
    try {
      await api.post('/api/config/verificar-drive', { drive_folder_id: driveFolderId })
      setDriveVerifyStatus('ok')
      showToast('Carpeta de Drive verificada y guardada')
    } catch (err) {
      setDriveVerifyStatus('error')
      setDriveVerifyMsg(err?.message || 'No se pudo acceder a la carpeta')
      showToast(err?.message || 'No se pudo acceder a la carpeta', 'error')
    } finally {
      setVerifyingDrive(false)
    }
  }

  // ── Sheets ────────────────────────────────────────────────────────────────

  const handleVerifySheet = async () => {
    if (!sheetId.trim()) return showToast('Ingresá el ID del Sheet', 'error')
    setVerifyingSheet(true)
    setSheetVerifyStatus(null)
    try {
      await api.post('/api/config/verificar-sheet', { sheet_id: sheetId })
      setSheetVerifyStatus('ok')
      showToast('Sheet verificado y guardado')
    } catch (err) {
      setSheetVerifyStatus('error')
      showToast(err?.message || 'No se pudo acceder al Sheet', 'error')
    } finally {
      setVerifyingSheet(false)
    }
  }

  const handleCreateSheet = async () => {
    setCreatingSheet(true)
    try {
      const res = await api.post('/api/config/crear-sheet')
      setCreatedSheetId(res.sheet_id)
      setCreatedSheetUrl(res.url || '')
      setSheetId(res.sheet_id)
      setSheetVerifyStatus('ok')
      setSheetsTab('existing')
      showToast('Sheet creado correctamente')
    } catch (err) {
      showToast(err?.message || 'Error al crear el Sheet', 'error')
    } finally {
      setCreatingSheet(false)
    }
  }

  // ── Contactos CC ──────────────────────────────────────────────────────────

  const handleAddCC = async () => {
    if (!ccNombre.trim()) return showToast('El nombre es obligatorio', 'error')
    if (!ccEmail.trim()) return showToast('El email es obligatorio', 'error')
    setSavingCC(true)
    try {
      const nuevo = await api.post('/api/contactos-cc', { nombre: ccNombre.trim(), email: ccEmail.trim() })
      setContactosCC((prev) => [...prev, nuevo])
      setCcNombre('')
      setCcEmail('')
      setCcModalOpen(false)
      showToast('Contacto agregado')
    } catch (err) {
      showToast(err?.message || 'Error al agregar el contacto', 'error')
    } finally {
      setSavingCC(false)
    }
  }

  const handleDeleteCC = async (id) => {
    setDeletingCC(id)
    try {
      await api.delete(`/api/contactos-cc/${id}`)
      setContactosCC((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      showToast(err?.message || 'Error al eliminar el contacto', 'error')
    } finally {
      setDeletingCC(null)
    }
  }

  // ── Empresa ───────────────────────────────────────────────────────────────

  const handleSaveEmpresa = async () => {
    if (!empresaNombre.trim()) return showToast('El nombre de la empresa es obligatorio', 'error')
    setSavingEmpresa(true)
    try {
      await api.put('/api/config', {
        empresa_nombre: empresaNombre,
        empresa_email: empresaEmail,
        drive_folder_id: driveFolderId,
      })
      showToast('Configuración guardada')
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'error')
    } finally {
      setSavingEmpresa(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg p-5 animate-pulse" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
            <div className="h-3 bg-surface-hover rounded w-40 mb-5" />
            <div className="h-8 bg-surface-hover rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Toast />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-text font-semibold text-[15px] mb-0.5">Configuración</h1>
        <p className="text-muted text-[12.5px]">Conectá Google y configurá Drive y Sheets para usar el sistema</p>
      </div>

      {/* ── Banner de estado general ── */}
      {allDone ? (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg mb-5 text-[13px]"
          style={{ backgroundColor: '#0A2A0A', border: '0.5px solid #1A4A1A', color: '#5CB85C' }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sistema configurado y listo para usar
        </div>
      ) : (
        <div
          className="px-4 py-3 rounded-lg mb-5"
          style={{ backgroundColor: '#171717', border: '0.5px solid #2A2A2A' }}
        >
          <p className="text-[12px] text-muted-dark mb-2 uppercase tracking-wider">Pasos pendientes</p>
          <div className="flex flex-col gap-1.5">
            {checks.filter((c) => !c.done).map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-[12.5px]" style={{ color: '#D4920A' }}>
                <IconWarn />
                {c.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* SECCIÓN 1 — Google */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <CardHeader icon={<IconGoogle />} title="Conectar con Google" />

          {googleConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCheck />
                <div>
                  <p className="text-text text-[13px]">Conectado</p>
                  {googleEmail && (
                    <p className="text-muted-dark text-[12px]">{googleEmail}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDisconnectOpen(true)}
                className="px-3 py-1.5 text-muted hover:text-error text-[12px] rounded-md transition-colors min-h-[36px]"
                style={{ border: '0.5px solid #2A2A2A' }}
              >
                Desconectar
              </button>
            </div>
          ) : googleNotConfigured ? (
            <div
              className="flex items-start gap-2.5 px-3 py-3 rounded-md text-[12.5px]"
              style={{ backgroundColor: '#1E1800', border: '0.5px solid #3A3000', color: '#D4920A' }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7.5 4.5v3.5M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              El sistema no está configurado. Contactá al administrador.
            </div>
          ) : (
            <div>
              <p className="text-muted text-[13px] leading-relaxed mb-5">
                Conectá tu cuenta de Google para habilitar el envío de emails,
                el guardado en Drive y el registro en Sheets.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                  className="flex items-center justify-center gap-2.5 py-2.5 rounded-lg transition-colors disabled:opacity-60 min-h-[44px]"
                  style={{
                    width: '260px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                    border: '1px solid #333',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  {connectingGoogle ? (
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#ccc', borderTopColor: '#333' }} />
                  ) : (
                    <IconGoogle />
                  )}
                  Conectar con Google
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* SECCIÓN 2 — Drive */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <CardHeader icon={<IconDrive />} title="Carpeta de Drive" />

          <InstruccionBox>
            <ol className="list-none m-0 p-0 flex flex-col gap-1">
              <li><span style={{ color: '#FF6B00' }}>1.</span> Abrí Google Drive en tu navegador</li>
              <li><span style={{ color: '#FF6B00' }}>2.</span> Creá una carpeta nueva llamada <code className="font-mono" style={{ color: '#E0E0E0' }}>Facturas</code></li>
              <li><span style={{ color: '#FF6B00' }}>3.</span> Abrí esa carpeta y copiá el ID que aparece en la URL:</li>
              <li className="pl-3">
                <code className="font-mono text-[11.5px]" style={{ color: '#555' }}>
                  drive.google.com/drive/folders/<span style={{ color: '#FF6B00', fontWeight: 600 }}>[ESTE-ES-EL-ID]</span>
                </code>
              </li>
              <li><span style={{ color: '#FF6B00' }}>4.</span> Pegalo en el campo de abajo</li>
            </ol>
          </InstruccionBox>

          <div className="mb-4">
            <label className="block text-[12.5px] text-text mb-1.5">ID de la carpeta raíz en Drive</label>
            <div className="flex gap-2">
              <input
                value={driveFolderId}
                onChange={(e) => { setDriveFolderId(e.target.value); setDriveVerifyStatus(null) }}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
                className="flex-1"
              />
              <button
                onClick={handleVerifyDrive}
                disabled={verifyingDrive || !driveFolderId.trim()}
                className="flex items-center gap-2 px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[36px] disabled:opacity-50 flex-shrink-0"
                style={{ border: '0.5px solid #2A2A2A' }}
              >
                {verifyingDrive ? <><Spinner /> Verificando…</> : 'Verificar acceso'}
              </button>
            </div>
            {driveVerifyStatus && (
              <div className="mt-2 flex items-center gap-2">
                <VerifyBadge status={driveVerifyStatus} />
                {driveVerifyStatus === 'error' && driveVerifyMsg && (
                  <span className="text-error text-[12px]">{driveVerifyMsg}</span>
                )}
              </div>
            )}
          </div>

          {/* Árbol visual */}
          <div
            className="rounded-md p-3"
            style={{ backgroundColor: '#111', border: '0.5px solid #1A1A1A' }}
          >
            <p className="text-muted-dark text-[11px] uppercase tracking-wider mb-2">Estructura de carpetas que se va a crear</p>
            <pre className="text-[12px] m-0 font-mono leading-6" style={{ color: '#555' }}>
{`📁 Facturas/
   📁 Proveedores/
      📁 {nombre del proveedor}/
   📁 Clientes/
      📁 {nombre del cliente}/`}
            </pre>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* SECCIÓN 3 — Sheets */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <CardHeader icon={<IconSheets />} title="Registro en Sheets" />

          {/* Tabs */}
          <div className="flex mb-5" style={{ borderBottom: '0.5px solid #222' }}>
            {[
              { key: 'existing', label: 'Usar un Sheet existente' },
              { key: 'new', label: 'Crear uno nuevo' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSheetsTab(tab.key)}
                className={`px-4 py-2 text-[12.5px] transition-colors ${
                  sheetsTab === tab.key ? 'text-text' : 'text-muted-dark hover:text-muted'
                }`}
                style={
                  sheetsTab === tab.key
                    ? { borderBottom: '2px solid #FF6B00', marginBottom: '-1px' }
                    : {}
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {sheetsTab === 'existing' ? (
            <div>
              <InstruccionBox>
                <ol className="list-none m-0 p-0 flex flex-col gap-1">
                  <li><span style={{ color: '#FF6B00' }}>1.</span> Abrí el Google Sheet donde querés registrar las facturas</li>
                  <li><span style={{ color: '#FF6B00' }}>2.</span> Copiá el ID que aparece en la URL:</li>
                  <li className="pl-3">
                    <code className="font-mono text-[11.5px]" style={{ color: '#555' }}>
                      docs.google.com/spreadsheets/d/<span style={{ color: '#FF6B00', fontWeight: 600 }}>[ESTE-ES-EL-ID]</span>/edit
                    </code>
                  </li>
                  <li><span style={{ color: '#FF6B00' }}>3.</span> Pegalo en el campo de abajo</li>
                </ol>
              </InstruccionBox>

              <div className="mb-4">
                <label className="block text-[12.5px] text-text mb-1.5">ID del Google Sheet</label>
                <div className="flex gap-2">
                  <input
                    value={sheetId}
                    onChange={(e) => { setSheetId(e.target.value); setSheetVerifyStatus(null) }}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74tLkh3"
                    className="flex-1"
                  />
                  <button
                    onClick={handleVerifySheet}
                    disabled={verifyingSheet || !sheetId.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[36px] disabled:opacity-50 flex-shrink-0"
                    style={{ border: '0.5px solid #2A2A2A' }}
                  >
                    {verifyingSheet ? <><Spinner /> Verificando…</> : 'Verificar acceso'}
                  </button>
                </div>
                {sheetVerifyStatus && (
                  <div className="mt-2">
                    <VerifyBadge status={sheetVerifyStatus} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted text-[13px] leading-relaxed mb-4">
                Creamos un Sheet nuevo en tu Drive con los encabezados ya configurados,
                listo para empezar a registrar facturas.
              </p>

              {createdSheetId ? (
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-md"
                  style={{ backgroundColor: '#0A2A0A', border: '0.5px solid #1A4A1A' }}
                >
                  <div>
                    <p className="text-[12px] text-muted-dark mb-0.5">Sheet creado</p>
                    <code className="text-[12px] font-mono" style={{ color: '#5CB85C' }}>{createdSheetId}</code>
                  </div>
                  {createdSheetUrl && (
                    <a
                      href={createdSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] underline transition-opacity hover:opacity-80"
                      style={{ color: '#5CB85C' }}
                    >
                      Abrir Sheet ↗
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCreateSheet}
                  disabled={creatingSheet || !googleConnected}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]"
                >
                  {creatingSheet ? <><Spinner white /> Creando…</> : 'Crear Sheet automáticamente'}
                </button>
              )}
            </div>
          )}

          {/* Referencia de columnas */}
          <div
            className="mt-5 rounded-md p-3"
            style={{ backgroundColor: '#111', border: '0.5px solid #1A1A1A' }}
          >
            <p className="text-muted-dark text-[11px] uppercase tracking-wider mb-2">Columnas que se van a registrar</p>
            <div className="flex flex-wrap gap-1.5">
              {SHEET_COLS.map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 rounded text-[11px] font-mono"
                  style={{ backgroundColor: '#1A1A1A', color: '#555', border: '0.5px solid #222' }}
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* SECCIÓN 4 — Contactos CC */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <CardHeader icon={<IconUsers />} title="Contactos en copia" />

          <p className="text-muted text-[12.5px] mb-4">
            Estas personas aparecen como opción en el selector de CC cuando enviás emails.
            Podés activarlos o desactivarlos por envío.
          </p>

          {contactosCC.length > 0 && (
            <div
              className="rounded-md mb-4 overflow-hidden"
              style={{ border: '0.5px solid #2A2A2A' }}
            >
              {contactosCC.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{
                    borderTop: i > 0 ? '0.5px solid #1E1E1E' : undefined,
                    backgroundColor: '#141414',
                  }}
                >
                  <div className="min-w-0">
                    <span className="text-text text-[12.5px]">{c.nombre}</span>
                    <span className="text-muted-dark text-[12px] ml-2">{c.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCC(c.id)}
                    disabled={deletingCC === c.id}
                    className="p-1.5 text-muted hover:text-error transition-colors disabled:opacity-40 flex-shrink-0 ml-3"
                    title="Eliminar"
                  >
                    {deletingCC === c.id ? (
                      <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: '#333', borderTopColor: '#888' }} />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {contactosCC.length === 0 && (
            <p className="text-muted-dark text-[12px] mb-4">No hay contactos guardados.</p>
          )}

          <button
            type="button"
            onClick={() => setCcModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-muted hover:text-text text-[12px] rounded-md transition-colors"
            style={{ border: '0.5px solid #2A2A2A' }}
          >
            + Agregar contacto
          </button>
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* SECCIÓN 5 — Empresa */}
        {/* ──────────────────────────────────────────────────────────────── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <CardHeader icon={<IconBuilding />} title="Datos de la empresa" />

          <p className="text-muted text-[12.5px] mb-4">
            Este nombre aparece como remitente en todos los emails que envía el sistema.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">
                Nombre de la empresa <span className="text-error">*</span>
              </label>
              <input
                value={empresaNombre}
                onChange={(e) => setEmpresaNombre(e.target.value)}
                placeholder="Mi Empresa S.A."
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">
                Email de contacto
              </label>
              <input
                type="email"
                value={empresaEmail}
                onChange={(e) => setEmpresaEmail(e.target.value)}
                placeholder="admin@miempresa.com"
              />
              <p className="text-muted-dark text-[11.5px] mt-1">
                Tiene que ser el email de la cuenta Google conectada
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveEmpresa}
              disabled={savingEmpresa}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]"
            >
              {savingEmpresa ? <><Spinner white /> Guardando…</> : 'Guardar cambios'}
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal agregar contacto CC ── */}
      {ccModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !savingCC) setCcModalOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-lg p-5 flex flex-col gap-4"
            style={{ backgroundColor: '#171717', border: '0.5px solid #2A2A2A' }}
          >
            <h3 className="text-text text-[14px] font-medium">Agregar contacto en copia</h3>

            <div>
              <label className="block text-[12.5px] text-text mb-1.5">
                Nombre <span className="text-error">*</span>
              </label>
              <input
                value={ccNombre}
                onChange={(e) => setCcNombre(e.target.value)}
                placeholder="Nombre completo"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddCC()}
              />
            </div>

            <div>
              <label className="block text-[12.5px] text-text mb-1.5">
                Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCC()}
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { setCcModalOpen(false); setCcNombre(''); setCcEmail('') }}
                disabled={savingCC}
                className="px-3 py-1.5 text-muted hover:text-text text-[12.5px] rounded-md transition-colors disabled:opacity-50"
                style={{ border: '0.5px solid #2A2A2A' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCC}
                disabled={savingCC}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors"
              >
                {savingCC ? <><Spinner white /> Guardando…</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ConfirmDialog desconectar Google ── */}
      <ConfirmDialog
        open={disconnectOpen}
        onClose={() => !disconnecting && setDisconnectOpen(false)}
        onConfirm={handleDisconnect}
        title="Desconectar Google"
        description="¿Desconectás tu cuenta de Google? El sistema dejará de poder enviar emails y acceder a Drive hasta que vuelvas a conectar."
        confirmLabel="Sí, desconectar"
      />
    </div>
  )
}
