import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmailPreviewModal from '../components/EmailPreviewModal'
import SelectorCC from '../components/SelectorCC'
import { useToast } from '../components/Toast'
import { usePreview } from '../hooks/usePreview'
import api from '../services/api'

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const ANIOS = [2023, 2024, 2025, 2026, 2027]

const VARS_ENVIO = [
  'nombre_destinatario', 'cliente', 'empresa_remitente', 'proveedor',
  'mes', 'año', 'numero_factura', 'fecha_factura', 'fecha_desde', 'fecha_hasta',
  'monto_total', 'clientes_con_montos',
]

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

function AdjuntoBadge({ factura }) {
  if (!factura) return null
  const badge = (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono"
      style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 10.5L8.5 4a2 2 0 00-2.83-2.83L1.17 5.67A3 3 0 005.41 9.91L9 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      {factura.nombre_archivo}
    </span>
  )
  if (factura.drive_url) {
    return (
      <a href={factura.drive_url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {badge}
      </a>
    )
  }
  return badge
}

export default function EnviarFactura() {
  const [clientes, setClientes] = useState([])
  const [facturas, setFacturas] = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [googleConnected, setGoogleConnected] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)

  // Sección 1 — múltiples clientes
  const [clienteItems, setClienteItems] = useState([{ clienteId: '', monto: '' }])
  const [facturaId, setFacturaId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')

  // Sección 1.5 — datos manuales (solo sin factura)
  const [datosManuales, setDatosManuales] = useState({
    proveedor: '', mes: '', anio: '', fechaDesde: '', fechaHasta: '', montoTotal: '', numeroFactura: '',
  })

  // Sección 2
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [cc, setCC] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const { showToast, Toast } = useToast()

  const facturaSeleccionada = facturas.find((f) => f.id === facturaId)
  const facturasConfirmadas = facturas.filter((f) => f.estado === 'confirmada')

  const clientesValidos = clienteItems.filter((ci) => !!ci.clienteId)
  const clientesUsados = clienteItems.map((ci) => ci.clienteId).filter(Boolean)
  const primerCliente = clientes.find((c) => c.id === clienteItems[0]?.clienteId)

  const previewEnabled = clientesValidos.length > 0 && !!plantillaId

  const setDatoField = (key, val) =>
    setDatosManuales((prev) => ({ ...prev, [key]: val }))

  const datosManualesPayload = !facturaId ? {
    proveedor: datosManuales.proveedor || null,
    mes: datosManuales.mes ? MESES_NOMBRES[parseInt(datosManuales.mes) - 1] : null,
    anio: datosManuales.anio || null,
    fecha_desde: datosManuales.fechaDesde || null,
    fecha_hasta: datosManuales.fechaHasta || null,
    monto_total: datosManuales.montoTotal ? parseFloat(datosManuales.montoTotal) : null,
    numero_factura: datosManuales.numeroFactura || null,
  } : null

  const previewParams = {
    factura_id: facturaId || null,
    plantilla_id: plantillaId,
    clientes: clientesValidos.map((ci) => ({
      cliente_id: ci.clienteId,
      monto: ci.monto ? parseFloat(ci.monto) : null,
    })),
    datos_manuales: datosManualesPayload,
  }

  const { asunto: previewAsunto, cuerpo: previewCuerpo, loading: previewLoading } = usePreview({
    endpoint: '/api/envios/preview',
    params: previewParams,
    enabled: previewEnabled,
  })

  useEffect(() => { if (previewAsunto) setAsunto(previewAsunto) }, [previewAsunto])
  useEffect(() => { if (previewCuerpo) setCuerpo(previewCuerpo) }, [previewCuerpo])

  useEffect(() => {
    Promise.all([
      api.get('/api/clientes'),
      api.get('/api/facturas'),
      api.get('/api/plantillas?tipo=envio'),
      api.get('/api/config'),
      api.get('/api/proveedores'),
    ])
      .then(([clis, facts, plants, cfg, provs]) => {
        setClientes(clis)
        setFacturas(facts)
        setPlantillas(plants)
        setGoogleConnected(cfg.connected)
        setProveedores(provs)
      })
      .catch(() => showToast('Error al cargar los datos', 'error'))
      .finally(() => setLoadingInit(false))
  }, [])

  // ── Clientes dinámicos ────────────────────────────────────────────────────

  const addCliente = () =>
    setClienteItems((prev) => [...prev, { clienteId: '', monto: '' }])

  const removeCliente = (i) =>
    setClienteItems((prev) => prev.filter((_, idx) => idx !== i))

  const setClienteField = (i, key, val) =>
    setClienteItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  // ── Enviar ────────────────────────────────────────────────────────────────

  const handleEnviar = async () => {
    if (clientesValidos.length === 0) return showToast('Seleccioná al menos un cliente', 'error')
    if (!plantillaId) return showToast('Seleccioná una plantilla', 'error')
    if (!asunto.trim()) return showToast('El asunto no puede estar vacío', 'error')
    if (!cuerpo.trim()) return showToast('El cuerpo no puede estar vacío', 'error')
    if (facturaSeleccionada && facturaSeleccionada.estado !== 'confirmada') {
      return showToast('Solo se pueden enviar facturas confirmadas', 'error')
    }

    setSending(true)
    try {
      const payload = {
        factura_id: facturaId || null,
        plantilla_id: plantillaId,
        clientes: clientesValidos.map((ci) => ({
          cliente_id: ci.clienteId,
          monto: ci.monto ? parseFloat(ci.monto) : null,
        })),
        asunto,
        cuerpo,
        cc,
        datos_manuales: datosManualesPayload,
      }
      await api.post('/api/envios/enviar', payload)
      showToast(`Factura enviada a ${primerCliente?.nombre || 'cliente'}`)
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') setGoogleConnected(false)
      showToast(err?.message || 'Error al enviar la factura', 'error')
    } finally {
      setSending(false)
    }
  }

  if (loadingInit) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
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
        <h1 className="text-text font-semibold text-[15px] mb-0.5">Enviar factura a cliente</h1>
        <p className="text-muted text-[12.5px]">Enviá una factura confirmada al cliente por email</p>
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
          <SectionLabel n="1">Destinatario, factura y plantilla</SectionLabel>

          {/* Factura + Plantilla */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <Field label="Factura">
              <select value={facturaId} onChange={(e) => setFacturaId(e.target.value)}>
                <option value="">Sin factura (completar manualmente)</option>
                {facturasConfirmadas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.numero_factura
                      ? `${f.numero_factura} — ${f.proveedor?.nombre || f.nombre_archivo}`
                      : f.nombre_archivo}
                  </option>
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

          {/* Badge adjunto */}
          {facturaSeleccionada && (
            <div className="mb-5 flex items-center gap-2">
              <span className="text-muted-dark text-[12px]">Adjunto:</span>
              <AdjuntoBadge factura={facturaSeleccionada} />
            </div>
          )}

          {/* Clientes múltiples */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text text-[12.5px] font-medium">
                Clientes <span className="text-error ml-0.5">*</span>
              </p>
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
                  (c) => !clientesUsados.includes(c.id) || c.id === item.clienteId
                )
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.clienteId}
                        onChange={(e) => setClienteField(i, 'clienteId', e.target.value)}
                      >
                        <option value="">Seleccioná un cliente</option>
                        {disponibles.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: '130px', flexShrink: 0 }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.monto}
                        onChange={(e) => setClienteField(i, 'monto', e.target.value)}
                        placeholder="Monto"
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
                Necesitás al menos un cliente para poder enviar.
              </p>
            )}

            {clientesValidos.length > 1 && primerCliente && (
              <p className="text-muted-dark text-[11.5px] mt-2">
                El email se enviará a <span className="text-muted">{primerCliente.nombre}</span>.
                Los montos de todos los clientes aparecen en{' '}
                <code className="font-mono" style={{ color: '#555' }}>{'{{clientes_con_montos}}'}</code>.
              </p>
            )}
          </div>
        </div>

        {/* ── Sección 1.5 — solo sin factura ── */}
        {!facturaId && (
          <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
            <SectionLabel n="1.5">Datos de la factura</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Proveedor">
                <select
                  value={datosManuales.proveedor}
                  onChange={(e) => setDatoField('proveedor', e.target.value)}
                >
                  <option value="">Seleccioná un proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
              </Field>
              <div>
                <label className="block text-[12.5px] text-text mb-1.5">Mes / Año</label>
                <div className="flex gap-2">
                  <select
                    value={datosManuales.mes}
                    onChange={(e) => setDatoField('mes', e.target.value)}
                  >
                    <option value="">Mes</option>
                    {MESES_NOMBRES.map((nombre, i) => (
                      <option key={i + 1} value={i + 1}>{nombre}</option>
                    ))}
                  </select>
                  <select
                    value={datosManuales.anio}
                    onChange={(e) => setDatoField('anio', e.target.value)}
                  >
                    <option value="">Año</option>
                    {ANIOS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Field label="Período desde">
                <input
                  type="date"
                  value={datosManuales.fechaDesde}
                  onChange={(e) => setDatoField('fechaDesde', e.target.value)}
                />
              </Field>
              <Field label="Período hasta">
                <input
                  type="date"
                  value={datosManuales.fechaHasta}
                  onChange={(e) => setDatoField('fechaHasta', e.target.value)}
                />
              </Field>
              <Field label="Monto total">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={datosManuales.montoTotal}
                  onChange={(e) => setDatoField('montoTotal', e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Número de factura">
                <input
                  value={datosManuales.numeroFactura}
                  onChange={(e) => setDatoField('numeroFactura', e.target.value)}
                  placeholder="Ej: 0001-00000123"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Sección 2 ── */}
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <SectionLabel n="2">Contenido del email</SectionLabel>
            <div className="flex flex-wrap gap-1 justify-end" style={{ maxWidth: '60%' }}>
              {VARS_ENVIO.map((v) => (
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
                placeholder="Asunto del email — se autocompleta al elegir factura, plantilla y clientes"
              />
            </Field>
            <Field label="Cuerpo" required>
              <textarea
                rows={10}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Cuerpo del email — se autocompleta al elegir factura, plantilla y clientes"
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
          {sending ? <><Spinner /> Enviando…</> : 'Enviar a cliente →'}
        </button>
      </div>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        asunto={asunto}
        cuerpo={cuerpo}
        destinatario={
          primerCliente
            ? { email: primerCliente.email, nombre: primerCliente.nombre }
            : null
        }
        adjunto={facturaSeleccionada?.nombre_archivo}
      />
    </div>
  )
}
