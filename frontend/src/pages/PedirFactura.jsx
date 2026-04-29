import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmailPreviewModal from '../components/EmailPreviewModal'
import SelectorCC from '../components/SelectorCC'
import { useToast } from '../components/Toast'
import { usePreview } from '../hooks/usePreview'
import api from '../services/api'

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

const VARS_PEDIDO = ['proveedor', 'mes', 'año', 'fecha_desde', 'fecha_hasta', 'empresa_remitente', 'clientes']

function SectionLabel({ n, children }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#FF6B00' }}>
      {n} — {children}
    </p>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[12.5px] text-text mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <div
      className="w-3.5 h-3.5 rounded-full border-2 animate-spin flex-shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
    />
  )
}

export default function PedirFactura() {
  const [proveedores, setProveedores] = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [clientes, setClientes] = useState([])
  const [googleConnected, setGoogleConnected] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)

  // Sección 1
  const [proveedorId, setProveedorId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')

  // Sección 2
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [clienteItems, setClienteItems] = useState([{ cliente_id: '', consultas_api: '' }])

  // Sección 3
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [cc, setCC] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const { showToast, Toast } = useToast()

  const clientesValidos = clienteItems.filter((ci) => !!ci.cliente_id)

  const previewEnabled = !!proveedorId && !!plantillaId

  const today = new Date().toISOString().split('T')[0]
  const previewParams = {
    proveedor_id: proveedorId,
    plantilla_id: plantillaId,
    mes: Number(mes),
    anio: Number(anio),
    fecha_desde: fechaDesde || today,
    fecha_hasta: fechaHasta || today,
    items: clientesValidos.map((ci) => ({
      cliente_id: ci.cliente_id,
      consultas_api: ci.consultas_api ? Number(ci.consultas_api) : undefined,
    })),
  }

  const { asunto: previewAsunto, cuerpo: previewCuerpo, loading: previewLoading } = usePreview({
    endpoint: '/api/pedidos/preview',
    params: previewParams,
    enabled: previewEnabled,
  })

  // Sincronizar preview → campos editables (solo si viene nuevo valor)
  useEffect(() => { if (previewAsunto) setAsunto(previewAsunto) }, [previewAsunto])
  useEffect(() => { if (previewCuerpo) setCuerpo(previewCuerpo) }, [previewCuerpo])

  useEffect(() => {
    Promise.all([
      api.get('/api/proveedores'),
      api.get('/api/plantillas?tipo=pedido'),
      api.get('/api/clientes'),
      api.get('/api/config'),
    ])
      .then(([provs, plants, clis, cfg]) => {
        setProveedores(provs)
        setPlantillas(plants)
        setClientes(clis)
        setGoogleConnected(cfg.connected)
      })
      .catch(() => showToast('Error al cargar los datos', 'error'))
      .finally(() => setLoadingInit(false))
  }, [])

  // ── Clientes dinámicos ────────────────────────────────────────────────────

  const addCliente = () =>
    setClienteItems((prev) => [...prev, { cliente_id: '', consultas_api: '' }])

  const removeCliente = (i) =>
    setClienteItems((prev) => prev.filter((_, idx) => idx !== i))

  const setClienteField = (i, key, val) =>
    setClienteItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const clientesUsados = clienteItems.map((ci) => ci.cliente_id).filter(Boolean)

  // ── Enviar ────────────────────────────────────────────────────────────────

  const handleEnviar = async () => {
    if (!proveedorId) return showToast('Seleccioná un proveedor', 'error')
    if (!plantillaId) return showToast('Seleccioná una plantilla', 'error')
    if (!mes || !anio) return showToast('Completá el período', 'error')
    if (!fechaDesde || !fechaHasta) return showToast('Completá las fechas del período', 'error')
    if (clientesValidos.length === 0) return showToast('Agregá al menos un cliente', 'error')
    if (!asunto.trim()) return showToast('El asunto no puede estar vacío', 'error')
    if (!cuerpo.trim()) return showToast('El cuerpo no puede estar vacío', 'error')

    setSending(true)
    try {
      const payload = {
        proveedor_id: proveedorId,
        plantilla_id: plantillaId,
        mes: Number(mes),
        anio: Number(anio),
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        clientes: clientesValidos.map((ci) => ({
          cliente_id: ci.cliente_id,
          consultas_api: ci.consultas_api ? Number(ci.consultas_api) : undefined,
        })),
        asunto,
        cuerpo,
        cc,
      }
      await api.post('/api/pedidos/enviar', payload)
      const prov = proveedores.find((p) => p.id === proveedorId)
      showToast(`Pedido enviado a ${prov?.nombre || 'proveedor'}`)
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') setGoogleConnected(false)
      showToast(err?.message || 'Error al enviar el pedido', 'error')
    } finally {
      setSending(false)
    }
  }

  const proveedorSeleccionado = proveedores.find((p) => p.id === proveedorId)

  if (loadingInit) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg p-5 animate-pulse" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
            <div className="h-2.5 bg-surface-hover rounded w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-surface-hover rounded" />
              <div className="h-8 bg-surface-hover rounded" />
            </div>
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
        <h1 className="text-text font-semibold text-[15px] mb-0.5">Pedir factura a proveedor</h1>
        <p className="text-muted text-[12.5px]">Enviá un email al proveedor solicitando las facturas del período</p>
      </div>

      {/* Aviso Google desconectado */}
      {googleConnected === false && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-md text-[12.5px] mb-5"
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
          para poder enviar emails.
        </div>
      )}

      <div className="flex flex-col gap-4">

        {/* ── Sección 1 ── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <SectionLabel n="1">Seleccionar destinatario y plantilla</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Proveedor" required>
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Seleccioná un proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Plantilla" required>
              <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}>
                <option value="">Seleccioná una plantilla</option>
                {plantillas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Sección 2 ── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <SectionLabel n="2">Período y clientes</SectionLabel>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <Field label="Mes" required>
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {MESES.map((m) => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </select>
            </Field>
            <Field label="Año" required>
              <input
                type="number"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                min="2000"
                max="2099"
              />
            </Field>
            <Field label="Fecha desde" required>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </Field>
            <Field label="Fecha hasta" required>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </Field>
          </div>

          {/* Lista de clientes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text text-[12.5px] font-medium">Clientes incluidos en el pedido</p>
              <button
                type="button"
                onClick={addCliente}
                className="flex items-center gap-1 px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors"
                style={{ border: '0.5px solid #2A2A2A' }}
              >
                + Agregar cliente
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {clienteItems.map((item, i) => {
                const disponibles = clientes.filter(
                  (c) => !clientesUsados.includes(c.id) || c.id === item.cliente_id
                )
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.cliente_id}
                        onChange={(e) => setClienteField(i, 'cliente_id', e.target.value)}
                      >
                        <option value="">Seleccioná un cliente</option>
                        {disponibles.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '150px', flexShrink: 0 }}>
                      <input
                        type="number"
                        min="0"
                        value={item.consultas_api}
                        onChange={(e) => setClienteField(i, 'consultas_api', e.target.value)}
                        placeholder="Consultas API"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCliente(i)}
                      disabled={clienteItems.length === 1}
                      className="p-2 text-muted hover:text-error transition-colors disabled:opacity-30 flex-shrink-0"
                      title="Eliminar cliente"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {clientesValidos.length === 0 && (
              <p className="text-[11.5px] mt-2" style={{ color: '#D4920A' }}>
                Necesitás al menos un cliente para poder enviar el pedido.
              </p>
            )}
          </div>
        </div>

        {/* ── Sección 3 ── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <SectionLabel n="3">Contenido del email</SectionLabel>
            <div className="flex flex-wrap gap-1 justify-end" style={{ maxWidth: '55%' }}>
              {VARS_PEDIDO.map((v) => (
                <span
                  key={v}
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                  style={{ backgroundColor: '#1A1A1A', color: '#555', border: '0.5px solid #2A2A2A' }}
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>

          {previewLoading && (
            <div className="flex items-center gap-2 text-[12px] mb-3" style={{ color: '#888' }}>
              <div
                className="w-3 h-3 rounded-full border animate-spin flex-shrink-0"
                style={{ borderColor: '#333', borderTopColor: '#888' }}
              />
              Generando preview…
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Field label="Asunto" required>
              <input
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto del email — se autocompleta al elegir proveedor y plantilla"
              />
            </Field>
            <Field label="Cuerpo" required>
              <textarea
                rows={10}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Cuerpo del email — se autocompleta al elegir proveedor y plantilla"
                style={{ resize: 'vertical' }}
              />
            </Field>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Copia (CC)</label>
              <SelectorCC value={cc} onChange={setCC} />
            </div>
          </div>
        </div>

      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 mt-5">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          disabled={!asunto && !cuerpo}
          className="px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[36px] disabled:opacity-40"
          style={{ border: '0.5px solid #2A2A2A' }}
        >
          Vista previa
        </button>
        <button
          type="button"
          onClick={handleEnviar}
          disabled={sending || googleConnected === false || googleConnected === null}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]"
        >
          {sending ? <><Spinner /> Enviando…</> : 'Enviar pedido →'}
        </button>
      </div>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        asunto={asunto}
        cuerpo={cuerpo}
        destinatario={
          proveedorSeleccionado
            ? { email: proveedorSeleccionado.email, nombre: proveedorSeleccionado.nombre }
            : null
        }
      />
    </div>
  )
}
