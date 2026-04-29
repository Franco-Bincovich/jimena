import EmailPreviewModal from '../components/EmailPreviewModal'
import FormField from '../components/FormField'
import SelectorCC from '../components/SelectorCC'
import { GoogleWarning, SectionLabel, Spinner } from '../components/EmailFormUI'
import { PedirSkeletonLoader, PeriodoClientesSection } from '../components/PedirFacturaUI'
import { usePedirFactura } from '../hooks/usePedirFactura'

const VARS_PEDIDO = ['proveedor', 'mes', 'año', 'fecha_desde', 'fecha_hasta', 'empresa_remitente', 'clientes']

export default function PedirFactura() {
  const {
    proveedores, plantillas, clientes, googleConnected, loadingInit,
    proveedorId, setProveedorId, plantillaId, setPlantillaId,
    mes, setMes, anio, setAnio, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    clienteItems, clientesValidos, clientesUsados,
    asunto, setAsunto, cuerpo, setCuerpo, cc, setCC,
    previewOpen, setPreviewOpen, sending, Toast, previewLoading,
    handleEnviar, addCliente, removeCliente, setClienteField,
  } = usePedirFactura()

  const proveedorSeleccionado = proveedores.find((p) => p.id === proveedorId)

  if (loadingInit) return <PedirSkeletonLoader />

  return (
    <div>
      <Toast />
      <div className="mb-6">
        <h1 className="text-text font-semibold text-[15px] mb-0.5">Pedir factura a proveedor</h1>
        <p className="text-muted text-[12.5px]">Enviá un email al proveedor solicitando las facturas del período</p>
      </div>

      {googleConnected === false && <GoogleWarning />}

      <div className="flex flex-col gap-4">
        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <SectionLabel n="1">Seleccionar destinatario y plantilla</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Proveedor" required>
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Seleccioná un proveedor</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </FormField>
            <FormField label="Plantilla" required>
              <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}>
                <option value="">Seleccioná una plantilla</option>
                {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <PeriodoClientesSection
          mes={mes} setMes={setMes} anio={anio} setAnio={setAnio}
          fechaDesde={fechaDesde} setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta} setFechaHasta={setFechaHasta}
          clienteItems={clienteItems} clientes={clientes}
          clientesUsados={clientesUsados} setClienteField={setClienteField}
          addCliente={addCliente} removeCliente={removeCliente}
          clientesValidos={clientesValidos}
        />

        <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <SectionLabel n="3">Contenido del email</SectionLabel>
            <div className="flex flex-wrap gap-1 justify-end" style={{ maxWidth: '55%' }}>
              {VARS_PEDIDO.map((v) => (
                <span key={v} className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ backgroundColor: '#1A1A1A', color: '#555', border: '0.5px solid #2A2A2A' }}>
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
          {previewLoading && (
            <div className="flex items-center gap-2 text-[12px] mb-3" style={{ color: '#888' }}>
              <div className="w-3 h-3 rounded-full border animate-spin flex-shrink-0" style={{ borderColor: '#333', borderTopColor: '#888' }} />
              Generando preview…
            </div>
          )}
          <div className="flex flex-col gap-3">
            <FormField label="Asunto" required>
              <input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto del email — se autocompleta al elegir proveedor y plantilla" />
            </FormField>
            <FormField label="Cuerpo" required>
              <textarea rows={10} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} placeholder="Cuerpo del email — se autocompleta al elegir proveedor y plantilla" style={{ resize: 'vertical' }} />
            </FormField>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Copia (CC)</label>
              <SelectorCC value={cc} onChange={setCC} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-5">
        <button type="button" onClick={() => setPreviewOpen(true)} disabled={!asunto && !cuerpo} className="px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[36px] disabled:opacity-40" style={{ border: '0.5px solid #2A2A2A' }}>
          Vista previa
        </button>
        <button type="button" onClick={handleEnviar} disabled={sending || googleConnected === false || googleConnected === null} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">
          {sending ? <><Spinner /> Enviando…</> : 'Enviar pedido →'}
        </button>
      </div>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        asunto={asunto}
        cuerpo={cuerpo}
        destinatario={proveedorSeleccionado ? { email: proveedorSeleccionado.email, nombre: proveedorSeleccionado.nombre } : null}
      />
    </div>
  )
}
