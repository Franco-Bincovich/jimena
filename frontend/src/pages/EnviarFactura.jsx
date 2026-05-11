import EmailPreviewModal from '../components/EmailPreviewModal'
import FormField from '../components/FormField'
import SelectorCC from '../components/SelectorCC'
import { GoogleWarning, SectionLabel, Spinner } from '../components/EmailFormUI'
import { ClientesEnvioSection, DatosManualesSection, EnviarSkeletonLoader } from '../components/EnviarFacturaUI'
import { useEnviarFactura } from '../hooks/useEnviarFactura'

const VARS_ENVIO = [
  'nombre_destinatario', 'cliente', 'empresa_remitente', 'proveedor',
  'mes', 'año', 'numero_factura', 'fecha_factura', 'fecha_desde', 'fecha_hasta',
  'monto_total', 'clientes_con_montos',
]

export default function EnviarFactura() {
  const {
    clientes, plantillas, proveedores, googleConnected, loadingInit,
    clienteItems, facturaId, setFacturaId, plantillaId, setPlantillaId,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    datosManuales, setDatoField, asunto, setAsunto, cuerpo, setCuerpo,
    cc, setCC, previewOpen, setPreviewOpen, sending, Toast,
    facturaSeleccionada, facturasDisponibles, clientesValidos, clientesUsados,
    primerCliente, previewLoading, handleEnviar, addCliente, removeCliente, setClienteField,
  } = useEnviarFactura()

  if (loadingInit) return <EnviarSkeletonLoader />

  return (
    <div>
      <Toast />
      <div className="mb-6">
        <h1 className="text-text font-semibold text-xl md:text-2xl mb-0.5">Enviar factura a cliente</h1>
        <p className="text-muted text-[12.5px]">Enviá una factura confirmada al cliente por email</p>
      </div>

      {googleConnected === false && <GoogleWarning />}

      <div className="flex flex-col gap-4">
        <ClientesEnvioSection
          facturaId={facturaId} setFacturaId={setFacturaId}
          plantillaId={plantillaId} setPlantillaId={setPlantillaId}
          facturasDisponibles={facturasDisponibles} plantillas={plantillas}
          fechaDesde={fechaDesde} setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta} setFechaHasta={setFechaHasta}
          facturaSeleccionada={facturaSeleccionada}
          clienteItems={clienteItems} clientes={clientes}
          clientesUsados={clientesUsados} setClienteField={setClienteField}
          addCliente={addCliente} removeCliente={removeCliente}
          clientesValidos={clientesValidos} primerCliente={primerCliente}
        />

        {!facturaId && (
          <DatosManualesSection datosManuales={datosManuales} setDatoField={setDatoField} proveedores={proveedores} />
        )}

        <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--c-surface)', border: '0.5px solid var(--c-border)' }}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <SectionLabel n="2">Contenido del email</SectionLabel>
            <div className="flex flex-wrap gap-1 justify-end" style={{ maxWidth: '60%' }}>
              {VARS_ENVIO.map((v) => (
                <span key={v} className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ backgroundColor: 'var(--c-border-s)', color: 'var(--c-muted-d)', border: '0.5px solid var(--c-border-l)' }}>
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
          {previewLoading && (
            <div className="flex items-center gap-2 text-[12px] mb-3" style={{ color: 'var(--c-muted)' }}>
              <div className="w-3 h-3 rounded-full border animate-spin flex-shrink-0" style={{ borderColor: 'var(--c-border-l)', borderTopColor: 'var(--c-muted)' }} />
              Generando preview…
            </div>
          )}
          <div className="flex flex-col gap-3">
            <FormField label="Asunto" required>
              <input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto del email — se autocompleta al elegir factura, plantilla y clientes" />
            </FormField>
            <FormField label="Cuerpo" required>
              <textarea rows={10} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} placeholder="Cuerpo del email — se autocompleta al elegir factura, plantilla y clientes" style={{ resize: 'vertical' }} />
            </FormField>
            <div>
              <label className="block text-[12.5px] text-text mb-1.5">Copia (CC)</label>
              <SelectorCC value={cc} onChange={setCC} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-5">
        <button type="button" onClick={() => setPreviewOpen(true)} disabled={!asunto && !cuerpo} className="px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[44px] disabled:opacity-40" style={{ border: '0.5px solid var(--c-border-l)' }}>
          Vista previa
        </button>
        <button type="button" onClick={handleEnviar} disabled={sending || googleConnected === false || googleConnected === null} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[44px]">
          {sending ? <><Spinner /> Enviando…</> : 'Enviar a cliente →'}
        </button>
      </div>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        asunto={asunto}
        cuerpo={cuerpo}
        destinatario={primerCliente ? { email: primerCliente.email, nombre: primerCliente.nombre } : null}
        adjunto={facturaSeleccionada?.nombre_archivo}
      />
    </div>
  )
}
