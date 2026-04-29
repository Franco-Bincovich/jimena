import { useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import api from '../services/api'

const EMPTY = { nombre: '', tipo: 'pedido', asunto: '', cuerpo: '' }

const VARS = {
  pedido: ['proveedor', 'mes', 'año', 'fecha_desde', 'fecha_hasta', 'empresa_remitente', 'clientes'],
  envio: ['nombre_destinatario', 'cliente', 'empresa_remitente', 'proveedor', 'mes', 'año', 'numero_factura', 'fecha_factura', 'fecha_desde', 'fecha_hasta', 'monto_total', 'clientes_con_montos'],
}

function TypeBadge({ tipo }) {
  return tipo === 'pedido' ? (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#2A1500', color: '#FF6B00', border: '0.5px solid #3A2000' }}>
      pedido
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}>
      envío
    </span>
  )
}

function CardSkeleton() {
  return Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="bg-surface rounded-lg p-4 animate-pulse" style={{ border: '0.5px solid #222' }}>
      <div className="flex justify-between mb-3">
        <div className="h-3.5 bg-surface-hover rounded w-32" />
        <div className="h-4 bg-surface-hover rounded w-14" />
      </div>
      <div className="h-3 bg-surface-hover rounded w-full mb-2" />
      <div className="h-3 bg-surface-hover rounded w-4/5" />
    </div>
  ))
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

function Section({ title, items, onEdit, onDelete, loading }) {
  return (
    <div className="mb-8">
      <h2 className="text-text text-[13px] font-medium mb-3">
        {title}
        <span className="text-muted-dark ml-2 font-normal">({items.length})</span>
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <CardSkeleton />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted text-[12.5px] py-4">No hay plantillas de este tipo.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div key={p.id} className="bg-surface rounded-lg flex flex-col" style={{ border: '0.5px solid #222' }}>
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-text text-[13px] font-medium leading-tight">{p.nombre}</span>
                  <TypeBadge tipo={p.tipo} />
                </div>
                <p className="text-muted text-[12px] mb-1.5 leading-tight">{p.asunto}</p>
                <p className="text-muted-dark text-[12px] leading-relaxed">
                  {p.cuerpo.length > 80 ? p.cuerpo.slice(0, 80) + '…' : p.cuerpo}
                </p>
              </div>
              <div className="px-4 py-2.5 flex gap-1" style={{ borderTop: '0.5px solid #222' }}>
                <button
                  onClick={() => onEdit(p)}
                  className="px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors min-h-[36px]"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(p)}
                  className="px-2.5 py-1.5 text-error hover:opacity-80 text-[12px] rounded transition-colors min-h-[36px]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Plantillas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmItem, setConfirmItem] = useState(null)
  const cuerpoRef = useRef(null)
  const { showToast, Toast } = useToast()

  useEffect(() => {
    api.get('/api/plantillas')
      .then(setItems)
      .catch(() => showToast('No se pudieron cargar las plantillas', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openCreate = (tipo = 'pedido') => {
    setEditItem(null)
    setForm({ ...EMPTY, tipo })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ nombre: item.nombre, tipo: item.tipo, asunto: item.asunto, cuerpo: item.cuerpo })
    setModalOpen(true)
  }

  const insertVar = (variable) => {
    const ta = cuerpoRef.current
    if (!ta) return
    const start = ta.selectionStart ?? form.cuerpo.length
    const end = ta.selectionEnd ?? form.cuerpo.length
    const tag = `{{${variable}}}`
    const next = form.cuerpo.slice(0, start) + tag + form.cuerpo.slice(end)
    setForm((f) => ({ ...f, cuerpo: next }))
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + tag.length, start + tag.length)
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        const updated = await api.put(`/api/plantillas/${editItem.id}`, form)
        setItems((prev) => prev.map((p) => (p.id === editItem.id ? updated : p)))
      } else {
        const created = await api.post('/api/plantillas', form)
        setItems((prev) => [...prev, created])
      }
      showToast('Plantilla guardada')
      setModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/plantillas/${confirmItem.id}`)
      setItems((prev) => prev.filter((p) => p.id !== confirmItem.id))
      showToast('Plantilla eliminada')
    } catch (err) {
      showToast(err?.message || 'Error al eliminar', 'error')
    } finally {
      setConfirmItem(null)
    }
  }

  const pedido = items.filter((p) => p.tipo === 'pedido')
  const envio = items.filter((p) => p.tipo === 'envio')

  return (
    <div>
      <Toast />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-text font-semibold text-[15px] mb-0.5">Plantillas</h1>
          <p className="text-muted text-[12.5px]">Plantillas de email para pedidos y envíos</p>
        </div>
        <button
          onClick={() => openCreate('pedido')}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]"
        >
          + Agregar
        </button>
      </div>

      {/* Secciones */}
      <Section
        title="Pedido a proveedor"
        items={pedido}
        onEdit={openEdit}
        onDelete={setConfirmItem}
        loading={loading}
      />
      <Section
        title="Envío a cliente"
        items={envio}
        onEdit={openEdit}
        onDelete={setConfirmItem}
        loading={loading}
      />

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editItem ? 'Editar plantilla' : 'Nueva plantilla'}
        size="lg"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" required>
              <input value={form.nombre} onChange={set('nombre')} placeholder="Ej: Pedido mensual" required />
            </Field>
            <Field label="Tipo" required>
              <select value={form.tipo} onChange={set('tipo')} required>
                <option value="pedido">Pedido a proveedor</option>
                <option value="envio">Envío a cliente</option>
              </select>
            </Field>
          </div>
          <Field label="Asunto" required>
            <input value={form.asunto} onChange={set('asunto')} placeholder="Ej: Pedido de facturas {{mes}} {{año}}" required />
          </Field>
          <div>
            <label className="block text-[12.5px] text-text mb-1.5">
              Cuerpo <span className="text-error">*</span>
            </label>
            <textarea
              ref={cuerpoRef}
              rows={10}
              value={form.cuerpo}
              onChange={set('cuerpo')}
              placeholder="Redactá el cuerpo del email. Usá las variables de abajo para insertar datos dinámicos."
              required
              style={{ resize: 'vertical' }}
            />
            {/* Variables disponibles */}
            <div className="mt-2 p-3 rounded-md" style={{ backgroundColor: '#141414', border: '0.5px solid #222' }}>
              <p className="text-muted-dark text-[11px] mb-2 uppercase tracking-wider">Variables disponibles — clic para insertar</p>
              <div className="flex flex-wrap gap-1.5">
                {VARS[form.tipo]?.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="px-2 py-0.5 rounded text-[11.5px] font-mono transition-colors hover:opacity-80"
                    style={{ backgroundColor: '#1E1E1E', color: '#888', border: '0.5px solid #2A2A2A' }}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmar eliminar */}
      <ConfirmDialog
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={handleDelete}
        title="Eliminar plantilla"
        description={`Vas a eliminar "${confirmItem?.nombre}". Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
      />
    </div>
  )
}
