import FormField from './FormField'
import { AdjuntoBadge, SectionLabel } from './EmailFormUI'

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const ANIOS = [2023, 2024, 2025, 2026, 2027]

export function EnviarSkeletonLoader() {
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

export function ClientesEnvioSection({
  facturaId, setFacturaId, plantillaId, setPlantillaId,
  facturasConfirmadas, plantillas, facturaSeleccionada,
  clienteItems, clientes, clientesUsados, setClienteField,
  addCliente, removeCliente, clientesValidos, primerCliente,
}) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <SectionLabel n="1">Destinatario, factura y plantilla</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <FormField label="Factura">
          <select value={facturaId} onChange={(e) => setFacturaId(e.target.value)}>
            <option value="">Sin factura (completar manualmente)</option>
            {facturasConfirmadas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.numero_factura ? `${f.numero_factura} — ${f.proveedor?.nombre || f.nombre_archivo}` : f.nombre_archivo}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Plantilla" required>
          <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)}>
            <option value="">Seleccioná una plantilla</option>
            {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </FormField>
      </div>
      {facturaSeleccionada && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-muted-dark text-[12px]">Adjunto:</span>
          <AdjuntoBadge factura={facturaSeleccionada} />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-text text-[12.5px] font-medium">Clientes <span className="text-error ml-0.5">*</span></p>
          <button type="button" onClick={addCliente} className="flex items-center gap-1 px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors" style={{ border: '0.5px solid #2A2A2A' }}>
            + Agregar cliente
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {clienteItems.map((item, i) => {
            const disponibles = clientes.filter((c) => !clientesUsados.includes(c.id) || c.id === item.clienteId)
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <select value={item.clienteId} onChange={(e) => setClienteField(i, 'clienteId', e.target.value)}>
                    <option value="">Seleccioná un cliente</option>
                    {disponibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div style={{ width: '130px', flexShrink: 0 }}>
                  <input type="number" min="0" step="0.01" value={item.monto} onChange={(e) => setClienteField(i, 'monto', e.target.value)} placeholder="Monto" />
                </div>
                <button type="button" onClick={() => removeCliente(i)} disabled={clienteItems.length === 1} className="p-2 text-muted hover:text-error transition-colors disabled:opacity-30 flex-shrink-0" title="Eliminar cliente">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
        {clientesValidos.length === 0 && (
          <p className="text-[11.5px] mt-2" style={{ color: '#D4920A' }}>Necesitás al menos un cliente para poder enviar.</p>
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
  )
}

export function DatosManualesSection({ datosManuales, setDatoField, proveedores }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <SectionLabel n="1.5">Datos de la factura</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Proveedor">
          <select value={datosManuales.proveedor} onChange={(e) => setDatoField('proveedor', e.target.value)}>
            <option value="">Seleccioná un proveedor</option>
            {proveedores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </FormField>
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Mes / Año</label>
          <div className="flex gap-2">
            <select value={datosManuales.mes} onChange={(e) => setDatoField('mes', e.target.value)}>
              <option value="">Mes</option>
              {MESES_NOMBRES.map((nombre, i) => <option key={i + 1} value={i + 1}>{nombre}</option>)}
            </select>
            <select value={datosManuales.anio} onChange={(e) => setDatoField('anio', e.target.value)}>
              <option value="">Año</option>
              {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <FormField label="Período desde">
          <input type="date" value={datosManuales.fechaDesde} onChange={(e) => setDatoField('fechaDesde', e.target.value)} />
        </FormField>
        <FormField label="Período hasta">
          <input type="date" value={datosManuales.fechaHasta} onChange={(e) => setDatoField('fechaHasta', e.target.value)} />
        </FormField>
        <FormField label="Monto total">
          <input type="number" min="0" step="0.01" value={datosManuales.montoTotal} onChange={(e) => setDatoField('montoTotal', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Número de factura">
          <input value={datosManuales.numeroFactura} onChange={(e) => setDatoField('numeroFactura', e.target.value)} placeholder="Ej: 0001-00000123" />
        </FormField>
      </div>
    </div>
  )
}
