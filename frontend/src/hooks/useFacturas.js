import { useEffect, useState } from 'react'
import { useToast } from '../components/Toast'
import { EMPTY_FORM, fromInputDate, toInputDate } from '../components/FacturasUI'
import api from '../services/api'

export function useFacturas() {
  const [pendientes, setPendientes] = useState([])
  const [todas, setTodas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(null)
  const [activeTab, setActiveTab] = useState('pendientes')
  const [proveedores, setProveedores] = useState([])
  const [clientes, setClientes] = useState([])
  const [confirmModal, setConfirmModal] = useState({ open: false, factura: null })
  const [confirmForm, setConfirmForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, factura: null, mode: 'delete' })
  const { showToast, Toast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/api/config'),
      api.get('/api/facturas/pendientes'),
      api.get('/api/facturas'),
      api.get('/api/proveedores'),
      api.get('/api/clientes'),
    ])
      .then(([cfg, pend, all, provs, clis]) => {
        setGoogleConnected(cfg.connected)
        setPendientes(pend)
        setTodas(all)
        setProveedores(provs)
        setClientes(clis)
      })
      .catch(() => showToast('Error al cargar la página', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleBuscar = async () => {
    setSearching(true)
    try {
      const res = await api.post('/api/facturas/buscar-nuevas')
      if (res.detectadas > 0) {
        showToast(`${res.detectadas} ${res.detectadas === 1 ? 'factura detectada' : 'facturas detectadas'}`)
        const [newPend, newAll] = await Promise.all([api.get('/api/facturas/pendientes'), api.get('/api/facturas')])
        setPendientes(newPend)
        setTodas(newAll)
        setActiveTab('pendientes')
      } else {
        showToast('No se encontraron facturas nuevas')
      }
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') setGoogleConnected(false)
      showToast(err?.message || 'Error al buscar facturas', 'error')
    } finally {
      setSearching(false)
    }
  }

  const openConfirmar = (factura) => {
    setConfirmForm({
      proveedor_id: factura.proveedor?.id || '',
      numero_factura: factura.numero_factura || '',
      fecha_factura: toInputDate(factura.fecha_factura),
      fecha_desde: toInputDate(factura.fecha_desde),
      fecha_hasta: toInputDate(factura.fecha_hasta),
      monto_total: factura.monto_total != null ? String(factura.monto_total) : '',
      descripcion: factura.descripcion || '',
      cliente_ids: factura.clientes?.map((c) => c.id) || [],
    })
    setConfirmModal({ open: true, factura })
  }

  const toggleCliente = (id) =>
    setConfirmForm((f) => ({
      ...f,
      cliente_ids: f.cliente_ids.includes(id) ? f.cliente_ids.filter((c) => c !== id) : [...f.cliente_ids, id],
    }))

  const setField = (key) => (e) => setConfirmForm((f) => ({ ...f, [key]: e.target.value }))

  const handleConfirmar = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { factura } = confirmModal
    const payload = {
      proveedor_id: confirmForm.proveedor_id || undefined,
      numero_factura: confirmForm.numero_factura || undefined,
      fecha_factura: fromInputDate(confirmForm.fecha_factura),
      fecha_desde: fromInputDate(confirmForm.fecha_desde),
      fecha_hasta: fromInputDate(confirmForm.fecha_hasta),
      monto_total: confirmForm.monto_total ? Number(confirmForm.monto_total) : undefined,
      descripcion: confirmForm.descripcion || undefined,
      cliente_ids: confirmForm.cliente_ids,
    }
    try {
      const updated = await api.put(`/api/facturas/${factura.id}/confirmar`, payload)
      setPendientes((prev) => prev.filter((f) => f.id !== factura.id))
      setTodas((prev) => prev.map((f) => (f.id === factura.id ? updated : f)))
      showToast('Factura confirmada y subida a Drive')
      setConfirmModal({ open: false, factura: null })
    } catch (err) {
      showToast(err?.message || 'Error al confirmar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const { factura, mode } = deleteModal
    try {
      await api.delete(`/api/facturas/${factura.id}`)
      setPendientes((prev) => prev.filter((f) => f.id !== factura.id))
      setTodas((prev) => prev.filter((f) => f.id !== factura.id))
      showToast(mode === 'discard' ? 'Factura descartada' : 'Factura eliminada')
    } catch (err) {
      showToast(err?.message || 'Error al eliminar', 'error')
    } finally {
      setDeleteModal({ open: false, factura: null, mode: 'delete' })
    }
  }

  return {
    pendientes, todas, loading, searching, googleConnected, activeTab, setActiveTab,
    proveedores, clientes, confirmModal, setConfirmModal, confirmForm, saving,
    deleteModal, setDeleteModal, Toast, handleBuscar,
    openConfirmar, toggleCliente, setField, handleConfirmar, handleDelete,
  }
}
