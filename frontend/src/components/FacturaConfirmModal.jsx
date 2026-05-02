import Modal from './Modal'

export default function FacturaConfirmModal({ open, saving, confirmForm, setField, toggleCliente, proveedores, clientes, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={() => !saving && onClose()} title="Confirmar factura" size="lg">
      <form onSubmit={onConfirm} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Proveedor <span className="text-error">*</span></label>
          <select value={confirmForm.proveedor_id} onChange={setField('proveedor_id')} required>
            <option value="">Seleccioná un proveedor</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">N° Factura</label>
            <input value={confirmForm.numero_factura} onChange={setField('numero_factura')} placeholder="0001-00000001" />
          </div>
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">Fecha de factura</label>
            <input type="date" value={confirmForm.fecha_factura} onChange={setField('fecha_factura')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">Período desde</label>
            <input type="date" value={confirmForm.fecha_desde} onChange={setField('fecha_desde')} />
          </div>
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">Período hasta</label>
            <input type="date" value={confirmForm.fecha_hasta} onChange={setField('fecha_hasta')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">Monto total</label>
            <input type="number" step="0.01" min="0" value={confirmForm.monto_total} onChange={setField('monto_total')} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">Descripción</label>
            <input value={confirmForm.descripcion} onChange={setField('descripcion')} placeholder="Descripción opcional" />
          </div>
        </div>

        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Clientes asociados <span className="text-error">*</span></label>
          <div className="rounded-md p-3 max-h-40 overflow-y-auto" style={{ backgroundColor: 'var(--c-bg)', border: '0.5px solid var(--c-border-l)' }}>
            {clientes.length === 0 ? (
              <p className="text-muted text-[12px]">No hay clientes cargados todavía</p>
            ) : clientes.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                <input type="checkbox" checked={confirmForm.cliente_ids.includes(c.id)} onChange={() => toggleCliente(c.id)} style={{ width: 'auto', flexShrink: 0 }} />
                <span className="text-text text-[12.5px]">{c.nombre}</span>
                {c.cuit && <span className="text-muted-dark text-[11.5px] font-mono">{c.cuit}</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-muted hover:text-text text-[12.5px] transition-colors min-h-[36px]">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">{saving ? 'Confirmando...' : 'Confirmar'}</button>
        </div>
      </form>
    </Modal>
  )
}
