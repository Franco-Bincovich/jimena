import { useEffect, useState } from 'react'
import { useToast } from '../components/Toast'
import { usePreview } from './usePreview'
import api from '../services/api'

export function usePedirFactura() {
  const [proveedores, setProveedores] = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [clientes, setClientes] = useState([])
  const [googleConnected, setGoogleConnected] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [proveedorId, setProveedorId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [clienteItems, setClienteItems] = useState([{ cliente_id: '', consultas_api: '' }])
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [cc, setCC] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const { showToast, Toast } = useToast()

  const clientesValidos = clienteItems.filter((ci) => !!ci.cliente_id)
  const clientesUsados = clienteItems.map((ci) => ci.cliente_id).filter(Boolean)
  const previewEnabled = !!proveedorId && !!plantillaId
  const today = new Date().toISOString().split('T')[0]

  const previewParams = {
    proveedor_id: proveedorId,
    plantilla_id: plantillaId,
    mes: Number(mes),
    anio: Number(anio),
    fecha_desde: fechaDesde || today,
    fecha_hasta: fechaHasta || today,
    clientes: clientesValidos.map((ci) => ({
      cliente_id: ci.cliente_id,
      consultas_api: ci.consultas_api ? Number(ci.consultas_api) : undefined,
    })),
  }

  const { asunto: previewAsunto, cuerpo: previewCuerpo, loading: previewLoading } = usePreview({
    endpoint: '/api/pedidos/preview',
    params: previewParams,
    enabled: previewEnabled,
  })

  useEffect(() => { if (previewAsunto) setAsunto(previewAsunto) }, [previewAsunto])
  useEffect(() => { if (previewCuerpo) setCuerpo(previewCuerpo) }, [previewCuerpo])

  useEffect(() => {
    Promise.all([
      api.get('/api/proveedores'),
      api.get('/api/plantillas?tipo=pedido'),
      api.get('/api/clientes'),
      api.get('/api/config'),
    ])
      .then(([provs, plants, clis, cfg]) => {
        setProveedores(provs)
        setPlantillas(plants)
        setClientes(clis)
        setGoogleConnected(cfg.connected)
      })
      .catch(() => showToast('Error al cargar los datos', 'error'))
      .finally(() => setLoadingInit(false))
  }, [])

  const addCliente = () => setClienteItems((prev) => [...prev, { cliente_id: '', consultas_api: '' }])
  const removeCliente = (i) => setClienteItems((prev) => prev.filter((_, idx) => idx !== i))
  const setClienteField = (i, key, val) =>
    setClienteItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const handleEnviar = async () => {
    if (!proveedorId) return showToast('Seleccioná un proveedor', 'error')
    if (!plantillaId) return showToast('Seleccioná una plantilla', 'error')
    if (!mes || !anio) return showToast('Completá el período', 'error')
    if (!fechaDesde || !fechaHasta) return showToast('Completá las fechas del período', 'error')
    if (clientesValidos.length === 0) return showToast('Agregá al menos un cliente', 'error')
    if (!asunto.trim()) return showToast('El asunto no puede estar vacío', 'error')
    if (!cuerpo.trim()) return showToast('El cuerpo no puede estar vacío', 'error')
    setSending(true)
    try {
      const payload = {
        proveedor_id: proveedorId,
        plantilla_id: plantillaId,
        mes: Number(mes),
        anio: Number(anio),
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        clientes: clientesValidos.map((ci) => ({
          cliente_id: ci.cliente_id,
          consultas_api: ci.consultas_api ? Number(ci.consultas_api) : undefined,
        })),
        asunto,
        cuerpo,
        cc,
      }
      await api.post('/api/pedidos/enviar', payload)
      const prov = proveedores.find((p) => p.id === proveedorId)
      showToast(`Pedido enviado a ${prov?.nombre || 'proveedor'}`)
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') setGoogleConnected(false)
      showToast(err?.message || 'Error al enviar el pedido', 'error')
    } finally {
      setSending(false)
    }
  }

  return {
    proveedores, plantillas, clientes, googleConnected, loadingInit,
    proveedorId, setProveedorId, plantillaId, setPlantillaId,
    mes, setMes, anio, setAnio, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    clienteItems, clientesValidos, clientesUsados,
    asunto, setAsunto, cuerpo, setCuerpo, cc, setCC,
    previewOpen, setPreviewOpen, sending, Toast, previewLoading,
    handleEnviar, addCliente, removeCliente, setClienteField,
  }
}
