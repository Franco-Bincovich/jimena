import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import PlantillaModal from '../components/PlantillaModal'
import { PlantillasSection } from '../components/PlantillasUI'
import { useToast } from '../components/Toast'
import api from '../services/api'

const EMPTY = { nombre: '', tipo: 'pedido', asunto: '', cuerpo: '' }

export default function Plantillas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [confirmItem, setConfirmItem] = useState(null)
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-text font-semibold text-xl md:text-2xl mb-0.5">Plantillas</h1>
          <p className="text-muted text-[12.5px]">Plantillas de email para pedidos y envíos</p>
        </div>
        <button onClick={() => openCreate('pedido')} className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">
          + Agregar
        </button>
      </div>

      <PlantillasSection title="Pedido a proveedor" items={pedido} onEdit={openEdit} onDelete={setConfirmItem} loading={loading} />
      <PlantillasSection title="Envío a cliente" items={envio} onEdit={openEdit} onDelete={setConfirmItem} loading={loading} />

      <PlantillaModal open={modalOpen} saving={saving} editItem={editItem} form={form} set={set} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <ConfirmDialog open={!!confirmItem} onClose={() => setConfirmItem(null)} onConfirm={handleDelete} title="Eliminar plantilla" description={`Vas a eliminar "${confirmItem?.nombre}". Esta acción no se puede deshacer.`} confirmLabel="Sí, eliminar" />
    </div>
  )
}
