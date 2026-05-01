import { useEffect, useState } from 'react'
import ClienteModal from '../components/ClienteModal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import api from '../services/api'

const EMPTY = { nombre: '', cuit: '', email: '', telefono: '', notas: '' }
const COLS = ['Nombre', 'CUIT', 'Email', 'Teléfono', 'Acciones']

function Skeleton() {
  return Array.from({ length: 3 }).map((_, i) => (
    <tr key={i} style={{ borderTop: '0.5px solid #222' }}>
      {COLS.map((c, j) => (
        <td key={c} className="px-4 py-3">
          <div className="h-3 rounded animate-pulse bg-surface-hover" style={{ width: j === 4 ? '80px' : '60%' }} />
        </td>
      ))}
    </tr>
  ))
}

export default function Clientes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmItem, setConfirmItem] = useState(null)
  const { showToast, Toast } = useToast()

  useEffect(() => {
    api.get('/api/clientes')
      .then(setItems)
      .catch(() => showToast('No se pudieron cargar los clientes', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const openCreate = () => { setEditItem(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ nombre: item.nombre, cuit: item.cuit || '', email: item.email || '', telefono: item.telefono || '', notas: item.notas || '' })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, email: form.email || null }
      if (editItem) {
        const updated = await api.put(`/api/clientes/${editItem.id}`, payload)
        setItems((prev) => prev.map((c) => (c.id === editItem.id ? updated : c)))
      } else {
        const created = await api.post('/api/clientes', payload)
        setItems((prev) => [...prev, created])
      }
      showToast('Cliente guardado')
      setModalOpen(false)
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/clientes/${confirmItem.id}`)
      setItems((prev) => prev.filter((c) => c.id !== confirmItem.id))
      showToast('Cliente eliminado')
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
          <h1 className="text-text font-semibold text-[15px] mb-0.5">Clientes</h1>
          <p className="text-muted text-[12.5px]">Administrá los clientes a quienes enviás facturas</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">
          + Agregar
        </button>
      </div>

      <div className="bg-surface rounded-lg overflow-hidden" style={{ border: '0.5px solid #222' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid #222' }}>
              {COLS.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-muted-dark text-[11.5px] font-medium uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skeleton /> : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-muted text-[12.5px] mb-3">No hay clientes todavía</p>
                  <button onClick={openCreate} className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[12px] rounded-md min-h-[36px] transition-colors">Agregar el primero</button>
                </td>
              </tr>
            ) : items.map((c) => (
              <tr key={c.id} className="hover:bg-surface-hover transition-colors" style={{ borderTop: '0.5px solid #222' }}>
                <td className="px-4 py-3 text-text text-[12.5px]">{c.nombre}</td>
                <td className="px-4 py-3 text-muted text-[12.5px] font-mono">{c.cuit || '—'}</td>
                <td className="px-4 py-3 text-muted text-[12.5px]">{c.email || '—'}</td>
                <td className="px-4 py-3 text-muted text-[12.5px]">{c.telefono || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors min-h-[36px]">Editar</button>
                    <button onClick={() => setConfirmItem(c)} className="px-2.5 py-1.5 text-error hover:opacity-80 text-[12px] rounded transition-colors min-h-[36px]">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClienteModal open={modalOpen} saving={saving} editItem={editItem} form={form} set={set} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <ConfirmDialog open={!!confirmItem} onClose={() => setConfirmItem(null)} onConfirm={handleDelete} title="Eliminar cliente" description={`Vas a eliminar a ${confirmItem?.nombre}. Esta acción no se puede deshacer.`} confirmLabel="Sí, eliminar" />
    </div>
  )
}
