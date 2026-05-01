import { useRef } from 'react'
import FormField from './FormField'
import Modal from './Modal'
import { VARS } from './PlantillasUI'

export default function PlantillaModal({ open, saving, editItem, form, set, onClose, onSave }) {
  const cuerpoRef = useRef(null)

  const insertVar = (variable) => {
    const ta = cuerpoRef.current
    if (!ta) return
    const start = ta.selectionStart ?? form.cuerpo.length
    const end = ta.selectionEnd ?? form.cuerpo.length
    const tag = `{{${variable}}}`
    const next = form.cuerpo.slice(0, start) + tag + form.cuerpo.slice(end)
    set('cuerpo')({ target: { value: next } })
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + tag.length, start + tag.length)
    })
  }

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title={editItem ? 'Editar plantilla' : 'Nueva plantilla'} size="lg">
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nombre" required>
            <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Pedido mensual" required />
          </FormField>
          <FormField label="Tipo" required>
            <select value={form.tipo} onChange={set('tipo')} required>
              <option value="pedido">Pedido a proveedor</option>
              <option value="envio">Envío a cliente</option>
            </select>
          </FormField>
        </div>
        <FormField label="Asunto" required>
          <input value={form.asunto} onChange={set('asunto')} placeholder="Ej: Pedido de facturas {{mes}} {{año}}" required />
        </FormField>
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Cuerpo <span className="text-error">*</span></label>
          <textarea ref={cuerpoRef} rows={10} value={form.cuerpo} onChange={set('cuerpo')} placeholder="Redactá el cuerpo del email. Usá las variables de abajo para insertar datos dinámicos." required style={{ resize: 'vertical' }} />
          <div className="mt-2 p-3 rounded-md" style={{ backgroundColor: '#141414', border: '0.5px solid #222' }}>
            <p className="text-muted-dark text-[11px] mb-2 uppercase tracking-wider">Variables disponibles — clic para insertar</p>
            <div className="flex flex-wrap gap-1.5">
              {VARS[form.tipo]?.map((v) => (
                <button key={v} type="button" onClick={() => insertVar(v)} className="px-2 py-0.5 rounded text-[11.5px] font-mono transition-colors hover:opacity-80" style={{ backgroundColor: '#1E1E1E', color: '#888', border: '0.5px solid #2A2A2A' }}>
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-muted hover:text-text text-[12.5px] transition-colors min-h-[36px]">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  )
}
