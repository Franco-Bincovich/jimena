import { useEffect, useState } from 'react'
import { useToast } from '../components/Toast'
import { usePreview } from './usePreview'
import api from '../services/api'

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function useEnviarFactura() {
  const [clientes, setClientes] = useState([])
  const [facturas, setFacturas] = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [googleConnected, setGoogleConnected] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [clienteItems, setClienteItems] = useState([{ clienteId: '', monto: '' }])
  const [facturaId, setFacturaId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [datosManuales, setDatosManuales] = useState({
    proveedor: '', mes: '', anio: '', fechaDesde: '', fechaHasta: '', montoTotal: '', numeroFactura: '',
  })
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [cc, setCC] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const { showToast, Toast } = useToast()

  const facturaSeleccionada = facturas.find((f) => f.id === facturaId)
  const facturasDisponibles = facturas.filter((f) => f.estado === 'pendiente_confirmacion' || f.estado === 'confirmada')
  const clientesValidos = clienteItems.filter((ci) => !!ci.clienteId)
  const clientesUsados = clienteItems.map((ci) => ci.clienteId).filter(Boolean)
  const primerCliente = clientes.find((c) => c.id === clienteItems[0]?.clienteId)
  const previewEnabled = clientesValidos.length > 0 && !!plantillaId

  const setDatoField = (key, val) => setDatosManuales((prev) => ({ ...prev, [key]: val }))

  const datosManualesPayload = !facturaId ? {
    proveedor: datosManuales.proveedor || null,
    mes: datosManuales.mes ? MESES_NOMBRES[parseInt(datosManuales.mes) - 1] : null,
    anio: datosManuales.anio || null,
    fecha_desde: datosManuales.fechaDesde || null,
    fecha_hasta: datosManuales.fechaHasta || null,
    monto_total: datosManuales.montoTotal ? parseFloat(datosManuales.montoTotal) : null,
    numero_factura: datosManuales.numeroFactura || null,
  } : null

  const previewParams = {
    factura_id: facturaId || null,
    plantilla_id: plantillaId,
    clientes: clientesValidos.map((ci) => ({
      cliente_id: ci.clienteId,
      monto: ci.monto ? parseFloat(ci.monto) : null,
    })),
    fecha_desde: fechaDesde || null,
    fecha_hasta: fechaHasta || null,
    datos_manuales: datosManualesPayload,
  }

  const { asunto: previewAsunto, cuerpo: previewCuerpo, loading: previewLoading } = usePreview({
    endpoint: '/api/envios/preview',
    params: previewParams,
    enabled: previewEnabled,
  })

  useEffect(() => { if (previewAsunto) setAsunto(previewAsunto) }, [previewAsunto])
  useEffect(() => { if (previewCuerpo) setCuerpo(previewCuerpo) }, [previewCuerpo])

  useEffect(() => {
    Promise.all([
      api.get('/api/clientes'),
      api.get('/api/facturas'),
      api.get('/api/plantillas?tipo=envio'),
      api.get('/api/config'),
      api.get('/api/proveedores'),
    ])
      .then(([clis, facts, plants, cfg, provs]) => {
        setClientes(clis)
        setFacturas(facts)
        setPlantillas(plants)
        setGoogleConnected(cfg.connected)
        setProveedores(provs)
      })
      .catch(() => showToast('Error al cargar los datos', 'error'))
      .finally(() => setLoadingInit(false))
  }, [])

  const addCliente = () => setClienteItems((prev) => [...prev, { clienteId: '', monto: '' }])
  const removeCliente = (i) => setClienteItems((prev) => prev.filter((_, idx) => idx !== i))
  const setClienteField = (i, key, val) =>
    setClienteItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const handleEnviar = async () => {
    if (clientesValidos.length === 0) return showToast('Seleccioná al menos un cliente', 'error')
    if (!plantillaId) return showToast('Seleccioná una plantilla', 'error')
    if (!asunto.trim()) return showToast('El asunto no puede estar vacío', 'error')
    if (!cuerpo.trim()) return showToast('El cuerpo no puede estar vacío', 'error')
    setSending(true)
    try {
      const payload = {
        factura_id: facturaId || null,
        plantilla_id: plantillaId,
        clientes: clientesValidos.map((ci) => ({
          cliente_id: ci.clienteId,
          monto: ci.monto ? parseFloat(ci.monto) : null,
        })),
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        asunto,
        cuerpo,
        cc,
        datos_manuales: datosManualesPayload,
      }
      await api.post('/api/envios/enviar', payload)
      showToast(`Factura enviada a ${primerCliente?.nombre || 'cliente'}`)
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONNECTED') setGoogleConnected(false)
      showToast(err?.message || 'Error al enviar la factura', 'error')
    } finally {
      setSending(false)
    }
  }

  return {
    clientes, plantillas, proveedores, googleConnected, loadingInit,
    clienteItems, facturaId, setFacturaId, plantillaId, setPlantillaId,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    datosManuales, setDatoField, asunto, setAsunto, cuerpo, setCuerpo,
    cc, setCC, previewOpen, setPreviewOpen, sending, Toast,
    facturaSeleccionada, facturasDisponibles, clientesValidos, clientesUsados,
    primerCliente, previewLoading, handleEnviar, addCliente, removeCliente, setClienteField,
  }
}
