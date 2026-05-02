import FormField from './FormField'
import { SectionLabel } from './EmailFormUI'

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

export function PedirSkeletonLoader() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg p-5 animate-pulse" style={{ backgroundColor: 'var(--c-surface)', border: '0.5px solid var(--c-border)' }}>
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

export function PeriodoClientesSection({
  mes, setMes, anio, setAnio, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
  clienteItems, clientes, clientesUsados, setClienteField, addCliente, removeCliente, clientesValidos,
}) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: 'var(--c-surface)', border: '0.5px solid var(--c-border)' }}>
      <SectionLabel n="2">Período y clientes</SectionLabel>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <FormField label="Mes" required>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </FormField>
        <FormField label="Año" required>
          <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} min="2000" max="2099" />
        </FormField>
        <FormField label="Fecha desde" required>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </FormField>
        <FormField label="Fecha hasta" required>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </FormField>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-text text-[12.5px] font-medium">Clientes incluidos en el pedido</p>
          <button type="button" onClick={addCliente} className="flex items-center gap-1 px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors" style={{ border: '0.5px solid var(--c-border-l)' }}>
            + Agregar cliente
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {clienteItems.map((item, i) => {
            const disponibles = clientes.filter((c) => !clientesUsados.includes(c.id) || c.id === item.cliente_id)
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <select value={item.cliente_id} onChange={(e) => setClienteField(i, 'cliente_id', e.target.value)}>
                    <option value="">Seleccioná un cliente</option>
                    {disponibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div style={{ width: '150px', flexShrink: 0 }}>
                  <input type="number" min="0" value={item.consultas_api} onChange={(e) => setClienteField(i, 'consultas_api', e.target.value)} placeholder="Consultas API" />
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
          <p className="text-[11.5px] mt-2" style={{ color: 'var(--c-warn-text)' }}>Necesitás al menos un cliente para poder enviar el pedido.</p>
        )}
      </div>
    </div>
  )
}
