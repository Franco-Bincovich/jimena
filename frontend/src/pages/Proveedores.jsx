import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import ProveedorModal from '../components/ProveedorModal'
import { useToast } from '../components/Toast'
import api from '../services/api'

const EMPTY = { nombre: '', email: '', cuit: '', notas: '' }
const COLS = ['Nombre', 'Email', 'CUIT', 'Notas', 'Acciones']

function Skeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <tr key={i} style={{ borderTop: '0.5px solid var(--c-border)' }}>
      {COLS.map((c, j) => (
        <td key={c} className="px-4 py-3">
          <div className="h-3 rounded animate-pulse bg-surface-hover" style={{ width: j === 4 ? '80px' : '60%' }} />
        </td>
      ))}
    </tr>
  ))
}

export default function Proveedores() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmItem, setConfirmItem] = useState(null)
  const { showToast, Toast } = useToast()

  useEffect(() => {
    api.get('/api/proveedores')
      .then(setItems)
      .catch(() => showToast('No se pudieron cargar los proveedores', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const openCreate = () => { setEditItem(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ nombre: item.nombre, email: item.email || '', cuit: item.cuit || '', notas: item.notas || '' })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        const updated = await api.put(`/api/proveedores/${editItem.id}`, form)
        setItems((prev) => prev.map((p) => (p.id === editItem.id ? updated : p)))
      } else {
        const created = await api.post('/api/proveedores', form)
        setItems((prev) => [...prev, created])
      }
      showToast('Proveedor guardado')
      setModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/proveedores/${confirmItem.id}`)
      setItems((prev) => prev.filter((p) => p.id !== confirmItem.id))
      showToast('Proveedor eliminado')
    } catch (err) {
      showToast(err?.message || 'Error al eliminar', 'error')
    } finally {
      setConfirmItem(null)
    }
  }

  return (
    <div>
      <Toast />
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-text font-semibold text-xl md:text-2xl mb-0.5">Proveedores</h1>
          <p className="text-muted text-[12.5px]">Administrá los proveedores de facturas</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[44px]">
          + Agregar
        </button>
      </div>

      <div className="bg-surface rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--c-border)' }}>
        <div style={{ overflowX: 'auto' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--c-border)' }}>
              {COLS.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-muted-dark text-[11.5px] font-medium uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skeleton /> : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-muted text-[12.5px] mb-3">No hay proveedores todavía</p>
                  <button onClick={openCreate} className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[12px] rounded-md min-h-[36px] transition-colors">Agregar el primero</button>
                </td>
              </tr>
            ) : items.map((p) => (
              <tr key={p.id} className="hover:bg-surface-hover transition-colors" style={{ borderTop: '0.5px solid var(--c-border)' }}>
                <td className="px-4 py-3 text-text text-[12.5px]">{p.nombre}</td>
                <td className="px-4 py-3 text-muted text-[12.5px]">{p.email || '—'}</td>
                <td className="px-4 py-3 text-muted text-[12.5px] font-mono">{p.cuit || '—'}</td>
                <td className="px-4 py-3 text-muted text-[12.5px]">{p.notas ? (p.notas.length > 40 ? p.notas.slice(0, 40) + '…' : p.notas) : '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors min-h-[36px]">Editar</button>
                    <button onClick={() => setConfirmItem(p)} className="px-2.5 py-1.5 text-error hover:opacity-80 text-[12px] rounded transition-colors min-h-[36px]">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <ProveedorModal open={modalOpen} saving={saving} editItem={editItem} form={form} set={set} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <ConfirmDialog open={!!confirmItem} onClose={() => setConfirmItem(null)} onConfirm={handleDelete} title="Eliminar proveedor" description={`Vas a eliminar a ${confirmItem?.nombre}. Esta acción no se puede deshacer.`} confirmLabel="Sí, eliminar" />
    </div>
  )
}
