import FormField from './FormField'
import Modal from './Modal'

export default function ProveedorModal({ open, saving, editItem, form, set, onClose, onSave }) {
  return (
    <Modal open={open} onClose={() => !saving && onClose()} title={editItem ? 'Editar proveedor' : 'Nuevo proveedor'} size="md">
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <FormField label="Nombre" required>
          <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Acme S.A." required />
        </FormField>
        <FormField label="Email" required helper="Podés ingresar varios emails separados por coma">
          <textarea rows={2} value={form.email} onChange={set('email')} placeholder="contacto@empresa.com, otro@empresa.com" required style={{ resize: 'none' }} />
        </FormField>
        <FormField label="CUIT">
          <input value={form.cuit} onChange={set('cuit')} placeholder="30-71884542-0" />
        </FormField>
        <FormField label="Notas">
          <textarea rows={3} value={form.notas} onChange={set('notas')} placeholder="Observaciones opcionales" />
        </FormField>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-muted hover:text-text text-[12.5px] transition-colors min-h-[36px]">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
