import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import api from '../services/api'

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtFecha = (s) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const fmtMonto = (v) =>
  v != null
    ? `$ ${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'

const toInputDate = (s) => {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
}

const fromInputDate = (v) => {
  if (!v) return undefined
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

const EMPTY_FORM = {
  proveedor_id: '', numero_factura: '', fecha_factura: '',
  fecha_desde: '', fecha_hasta: '',
  monto_total: '', descripcion: '', cliente_ids: [],
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PendienteBadge() {
  return (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap"
      style={{ backgroundColor: '#1E1800', color: '#D4920A', border: '0.5px solid #3A3000' }}
    >
      Pendiente de confirmar
    </span>
  )
}

function EstadoBadge({ estado, driveUrl }) {
  if (estado === 'confirmada') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
        style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}
      >
        Confirmada
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline opacity-80 hover:opacity-100"
            title="Ver en Drive"
          >
            ↗
          </a>
        )}
      </span>
    )
  }
  return <PendienteBadge />
}

function Spinner() {
  return (
    <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
    />
  )
}

function CardSkeleton() {
  return Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="bg-surface rounded-lg p-4 animate-pulse" style={{ border: '0.5px solid #222' }}>
      <div className="h-3.5 bg-surface-hover rounded w-52 mb-3" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((j) => <div key={j} className="h-3 bg-surface-hover rounded" />)}
      </div>
    </div>
  ))
}

function TableSkeleton() {
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

// ── Main ───────────────────────────────────────────────────────────────────

export default function Facturas() {
  const [pendientes, setPendientes] = useState([])
  const [todas, setTodas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(null)
  const [activeTab, setActiveTab] = useState('pendientes')
  const [proveedores, setProveedores] = useState([])
  const [clientes, setClientes] = useState([])
  const [confirmModal, setConfirmModal] = useState({ open: false, factura: null })
  const [confirmForm, setConfirmForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, factura: null, mode: 'delete' })
  const { showToast, Toast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/api/config'),
      api.get('/api/facturas/pendientes'),
      api.get('/api/facturas'),
      api.get('/api/proveedores'),
      api.get('/api/clientes'),
    ])
      .then(([cfg, pend, all, provs, clis]) => {
        setGoogleConnected(cfg.connected)
        setPendientes(pend)
        setTodas(all)
        setProveedores(provs)
        setClientes(clis)
      })
      .catch(() => showToast('Error al cargar la página', 'error'))
      .finally(() => setLoading(false))
  }, [])

  // ── Buscar en Gmail ───────────────────────────────────────────────────────

  const handleBuscar = async () => {
    setSearching(true)
    try {
      const res = await api.post('/api/facturas/buscar-nuevas')
      if (res.detectadas > 0) {
        showToast(`${res.detectadas} ${res.detectadas === 1 ? 'factura detectada' : 'facturas detectadas'}`)
        const [newPend, newAll] = await Promise.all([
          api.get('/api/facturas/pendientes'),
          api.get('/api/facturas'),
        ])
        setPendientes(newPend)
        setTodas(newAll)
        setActiveTab('pendientes')
      } else {
        showToast('No se encontraron facturas nuevas')
      }
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') setGoogleConnected(false)
      showToast(err?.message || 'Error al buscar facturas', 'error')
    } finally {
      setSearching(false)
    }
  }

  // ── Confirmar factura ─────────────────────────────────────────────────────

  const openConfirmar = (factura) => {
    setConfirmForm({
      proveedor_id: factura.proveedor?.id || '',
      numero_factura: factura.numero_factura || '',
      fecha_factura: toInputDate(factura.fecha_factura),
      fecha_desde: toInputDate(factura.fecha_desde),
      fecha_hasta: toInputDate(factura.fecha_hasta),
      monto_total: factura.monto_total != null ? String(factura.monto_total) : '',
      descripcion: factura.descripcion || '',
      cliente_ids: factura.clientes?.map((c) => c.id) || [],
    })
    setConfirmModal({ open: true, factura })
  }

  const toggleCliente = (id) =>
    setConfirmForm((f) => ({
      ...f,
      cliente_ids: f.cliente_ids.includes(id)
        ? f.cliente_ids.filter((c) => c !== id)
        : [...f.cliente_ids, id],
    }))

  const setField = (key) => (e) => setConfirmForm((f) => ({ ...f, [key]: e.target.value }))

  const handleConfirmar = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { factura } = confirmModal
    const payload = {
      proveedor_id: confirmForm.proveedor_id || undefined,
      numero_factura: confirmForm.numero_factura || undefined,
      fecha_factura: fromInputDate(confirmForm.fecha_factura),
      fecha_desde: fromInputDate(confirmForm.fecha_desde),
      fecha_hasta: fromInputDate(confirmForm.fecha_hasta),
      monto_total: confirmForm.monto_total ? Number(confirmForm.monto_total) : undefined,
      descripcion: confirmForm.descripcion || undefined,
      cliente_ids: confirmForm.cliente_ids,
    }
    try {
      const updated = await api.put(`/api/facturas/${factura.id}/confirmar`, payload)
      setPendientes((prev) => prev.filter((f) => f.id !== factura.id))
      setTodas((prev) => prev.map((f) => (f.id === factura.id ? updated : f)))
      showToast('Factura confirmada y subida a Drive')
      setConfirmModal({ open: false, factura: null })
    } catch (err) {
      showToast(err?.message || 'Error al confirmar', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar / Descartar ──────────────────────────────────────────────────

  const handleDelete = async () => {
    const { factura, mode } = deleteModal
    try {
      await api.delete(`/api/facturas/${factura.id}`)
      setPendientes((prev) => prev.filter((f) => f.id !== factura.id))
      setTodas((prev) => prev.filter((f) => f.id !== factura.id))
      showToast(mode === 'discard' ? 'Factura descartada' : 'Factura eliminada')
    } catch (err) {
      showToast(err?.message || 'Error al eliminar', 'error')
    } finally {
      setDeleteModal({ open: false, factura: null, mode: 'delete' })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <Toast />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-text font-semibold text-[15px] mb-0.5">Facturas recibidas</h1>
        <p className="text-muted text-[12.5px]">Procesá las facturas de Gmail y confirmá su carga en Drive</p>
      </div>

      {/* Sección 1 — Buscar en Gmail */}
      <div className="p-4 bg-surface rounded-lg mb-6" style={{ border: '0.5px solid #222' }}>
        <p className="text-text text-[13px] font-medium mb-1">Buscar facturas nuevas</p>
        <p className="text-muted text-[12px] mb-4">
          Escanea la bandeja de Gmail y detecta emails con facturas adjuntas como PDF.
        </p>

        {googleConnected === false ? (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-md text-[12.5px]"
            style={{ backgroundColor: '#1E1800', border: '0.5px solid #3A3000', color: '#D4920A' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.1" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Conectá tu cuenta de Google en{' '}
            <Link to="/configuracion" className="underline hover:opacity-80 transition-opacity">
              Configuración
            </Link>{' '}
            para usar esta función.
          </div>
        ) : (
          <button
            onClick={handleBuscar}
            disabled={searching || googleConnected === null}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[40px]"
          >
            {searching ? (
              <>
                <Spinner />
                Buscando en Gmail...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.1" />
                  <path d="M1 4.5l6 4 6-4" stroke="white" strokeWidth="1.1" strokeLinejoin="round" />
                </svg>
                Buscar facturas nuevas en Gmail
              </>
            )}
          </button>
        )}
      </div>

      {/* Sección 2 — Tabs */}
      <div>
        {/* Tab headers */}
        <div className="flex" style={{ borderBottom: '0.5px solid #222' }}>
          {[
            { key: 'pendientes', label: `Pendientes de confirmar (${pendientes.length})` },
            { key: 'todas', label: `Todas (${todas.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[12.5px] transition-colors ${
                activeTab === tab.key ? 'text-text' : 'text-muted-dark hover:text-muted'
              }`}
              style={
                activeTab === tab.key
                  ? { borderBottom: '2px solid #FF6B00', marginBottom: '-1px' }
                  : {}
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {/* ── Tab Pendientes ── */}
          {activeTab === 'pendientes' && (
            loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><CardSkeleton /></div>
            ) : pendientes.length === 0 ? (
              <div className="py-12 text-center text-muted text-[12.5px]">
                No hay facturas pendientes de confirmar
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pendientes.map((f) => (
                  <div key={f.id} className="bg-surface rounded-lg flex flex-col" style={{ border: '0.5px solid #222' }}>
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <code className="text-primary text-[12px] break-all leading-tight">{f.nombre_archivo}</code>
                        <PendienteBadge />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                          ['Proveedor', f.proveedor?.nombre || '—', false],
                          ['N° Factura', f.numero_factura || '—', true],
                          ['Fecha', fmtFecha(f.fecha_factura), false],
                          ['Monto', fmtMonto(f.monto_total), false],
                        ].map(([label, value, mono]) => (
                          <div key={label}>
                            <p className="text-muted-dark text-[11px] mb-0.5">{label}</p>
                            <p className={`text-text text-[12px] ${mono ? 'font-mono' : ''}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {f.clientes?.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '0.5px solid #1A1A1A' }}>
                          <span className="text-muted-dark text-[11px]">Clientes detectados: </span>
                          <span className="text-muted text-[12px]">{f.clientes.map((c) => c.nombre).join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 flex gap-2" style={{ borderTop: '0.5px solid #222' }}>
                      <button
                        onClick={() => openConfirmar(f)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[12px] font-medium rounded-md transition-colors min-h-[36px]"
                      >
                        Confirmar y subir a Drive
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, factura: f, mode: 'discard' })}
                        className="px-3 py-1.5 text-muted hover:text-error text-[12px] rounded-md transition-colors min-h-[36px]"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Tab Todas ── */}
          {activeTab === 'todas' && (
            <div className="bg-surface rounded-lg overflow-hidden" style={{ border: '0.5px solid #222' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #222' }}>
                    {['Archivo', 'Proveedor', 'N° Factura', 'Fecha', 'Monto', 'Estado', 'Acciones'].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-3 text-left text-muted-dark text-[11.5px] font-medium uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton />
                  ) : todas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted text-[12.5px]">
                        No hay facturas cargadas todavía
                      </td>
                    </tr>
                  ) : (
                    todas.map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-surface-hover transition-colors"
                        style={{ borderTop: '0.5px solid #222' }}
                      >
                        <td className="px-3 py-3">
                          <code className="text-primary text-[11.5px]">{f.nombre_archivo}</code>
                        </td>
                        <td className="px-3 py-3 text-muted text-[12px]">{f.proveedor?.nombre || '—'}</td>
                        <td className="px-3 py-3 text-muted text-[12px] font-mono">{f.numero_factura || '—'}</td>
                        <td className="px-3 py-3 text-muted text-[12px] whitespace-nowrap">{fmtFecha(f.fecha_factura)}</td>
                        <td className="px-3 py-3 text-muted text-[12px] whitespace-nowrap">{fmtMonto(f.monto_total)}</td>
                        <td className="px-3 py-3">
                          <EstadoBadge estado={f.estado} driveUrl={f.drive_url} />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setDeleteModal({ open: true, factura: f, mode: 'delete' })}
                            className="px-2.5 py-1.5 text-error hover:opacity-80 text-[12px] rounded transition-colors min-h-[36px]"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal confirmar factura ── */}
      <Modal
        open={confirmModal.open}
        onClose={() => !saving && setConfirmModal({ open: false, factura: null })}
        title="Confirmar factura"
        size="lg"
      >
        <form onSubmit={handleConfirmar} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">
              Proveedor <span className="text-error">*</span>
            </label>
            <select value={confirmForm.proveedor_id} onChange={setField('proveedor_id')} required>
              <option value="">Seleccioná un proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">N° Factura</label>
              <input
                value={confirmForm.numero_factura}
                onChange={setField('numero_factura')}
                placeholder="0001-00000001"
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Fecha de factura</label>
              <input
                type="date"
                value={confirmForm.fecha_factura}
                onChange={setField('fecha_factura')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Período desde</label>
              <input
                type="date"
                value={confirmForm.fecha_desde}
                onChange={setField('fecha_desde')}
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Período hasta</label>
              <input
                type="date"
                value={confirmForm.fecha_hasta}
                onChange={setField('fecha_hasta')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Monto total</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={confirmForm.monto_total}
                onChange={setField('monto_total')}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Descripción</label>
              <input
                value={confirmForm.descripcion}
                onChange={setField('descripcion')}
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] text-text mb-1.5">
              Clientes asociados <span className="text-error">*</span>
            </label>
            <div
              className="rounded-md p-3 max-h-40 overflow-y-auto"
              style={{ backgroundColor: '#141414', border: '0.5px solid #2A2A2A' }}
            >
              {clientes.length === 0 ? (
                <p className="text-muted text-[12px]">No hay clientes cargados todavía</p>
              ) : (
                clientes.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={confirmForm.cliente_ids.includes(c.id)}
                      onChange={() => toggleCliente(c.id)}
                      style={{ width: 'auto', flexShrink: 0 }}
                    />
                    <span className="text-text text-[12.5px]">{c.nombre}</span>
                    {c.cuit && (
                      <span className="text-muted-dark text-[11.5px] font-mono">{c.cuit}</span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirmModal({ open: false, factura: null })}
              disabled={saving}
              className="px-4 py-2 text-muted hover:text-text text-[12.5px] transition-colors min-h-[36px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]"
            >
              {saving ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm eliminar/descartar ── */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, factura: null, mode: 'delete' })}
        onConfirm={handleDelete}
        title={deleteModal.mode === 'discard' ? 'Descartar factura' : 'Eliminar factura'}
        description={
          deleteModal.mode === 'discard'
            ? `¿Descartás la factura "${deleteModal.factura?.nombre_archivo}"? Se eliminará el archivo.`
            : `Vas a eliminar "${deleteModal.factura?.nombre_archivo}". Esta acción no se puede deshacer.`
        }
        confirmLabel={deleteModal.mode === 'discard' ? 'Sí, descartar' : 'Sí, eliminar'}
      />
    </div>
  )
}
