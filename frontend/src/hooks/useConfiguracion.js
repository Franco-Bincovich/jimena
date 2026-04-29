import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import api from '../services/api'

export function useConfiguracion() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast, Toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleNotConfigured, setGoogleNotConfigured] = useState(false)
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [driveFolderId, setDriveFolderId] = useState('')
  const [driveVerifyStatus, setDriveVerifyStatus] = useState(null)
  const [driveVerifyMsg, setDriveVerifyMsg] = useState('')
  const [verifyingDrive, setVerifyingDrive] = useState(false)
  const [sheetsTab, setSheetsTab] = useState('existing')
  const [sheetId, setSheetId] = useState('')
  const [sheetVerifyStatus, setSheetVerifyStatus] = useState(null)
  const [verifyingSheet, setVerifyingSheet] = useState(false)
  const [creatingSheet, setCreatingSheet] = useState(false)
  const [createdSheetId, setCreatedSheetId] = useState('')
  const [createdSheetUrl, setCreatedSheetUrl] = useState('')
  const [contactosCC, setContactosCC] = useState([])
  const [ccModalOpen, setCcModalOpen] = useState(false)
  const [ccNombre, setCcNombre] = useState('')
  const [ccEmail, setCcEmail] = useState('')
  const [savingCC, setSavingCC] = useState(false)
  const [deletingCC, setDeletingCC] = useState(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaEmail, setEmpresaEmail] = useState('')
  const [savingEmpresa, setSavingEmpresa] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('connected') === 'true') showToast('¡Google conectado correctamente!')
    else if (params.get('error') === 'oauth_failed') showToast('No se pudo conectar con Google. Intentá de nuevo.', 'error')
    if (params.has('connected') || params.has('error')) navigate('/configuracion', { replace: true })
  }, [])

  useEffect(() => {
    Promise.all([api.get('/api/config'), api.get('/api/contactos-cc')])
      .then(([cfg, ccs]) => {
        setGoogleConnected(!!cfg.connected)
        setGoogleEmail(cfg.google_email || '')
        setDriveFolderId(cfg.drive_folder_id || '')
        setSheetId(cfg.sheet_id || '')
        setEmpresaNombre(cfg.empresa_nombre || '')
        setEmpresaEmail(cfg.empresa_email || '')
        if (cfg.drive_folder_id) setDriveVerifyStatus('ok')
        if (cfg.sheet_id) setSheetVerifyStatus('ok')
        setContactosCC(ccs)
      })
      .catch(() => showToast('Error al cargar la configuración', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true)
    try {
      const res = await api.get('/api/auth/google/url')
      window.location.href = res.url
    } catch (err) {
      if (err?.code === 'GOOGLE_NOT_CONFIGURED') setGoogleNotConfigured(true)
      else showToast(err?.message || 'Error al obtener la URL de autorización', 'error')
      setConnectingGoogle(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await api.post('/api/auth/google/disconnect')
      setGoogleConnected(false)
      setGoogleEmail('')
      showToast('Cuenta de Google desconectada')
    } catch (err) {
      showToast(err?.message || 'Error al desconectar', 'error')
    } finally {
      setDisconnecting(false)
      setDisconnectOpen(false)
    }
  }

  const handleVerifyDrive = async () => {
    if (!driveFolderId.trim()) return showToast('Ingresá el ID de la carpeta', 'error')
    setVerifyingDrive(true)
    setDriveVerifyStatus(null)
    try {
      await api.post('/api/config/verificar-drive', { drive_folder_id: driveFolderId })
      setDriveVerifyStatus('ok')
      showToast('Carpeta de Drive verificada y guardada')
    } catch (err) {
      setDriveVerifyStatus('error')
      setDriveVerifyMsg(err?.message || 'No se pudo acceder a la carpeta')
      showToast(err?.message || 'No se pudo acceder a la carpeta', 'error')
    } finally {
      setVerifyingDrive(false)
    }
  }

  const handleVerifySheet = async () => {
    if (!sheetId.trim()) return showToast('Ingresá el ID del Sheet', 'error')
    setVerifyingSheet(true)
    setSheetVerifyStatus(null)
    try {
      await api.post('/api/config/verificar-sheet', { sheet_id: sheetId })
      setSheetVerifyStatus('ok')
      showToast('Sheet verificado y guardado')
    } catch (err) {
      setSheetVerifyStatus('error')
      showToast(err?.message || 'No se pudo acceder al Sheet', 'error')
    } finally {
      setVerifyingSheet(false)
    }
  }

  const handleCreateSheet = async () => {
    setCreatingSheet(true)
    try {
      const res = await api.post('/api/config/crear-sheet')
      setCreatedSheetId(res.sheet_id)
      setCreatedSheetUrl(res.url || '')
      setSheetId(res.sheet_id)
      setSheetVerifyStatus('ok')
      setSheetsTab('existing')
      showToast('Sheet creado correctamente')
    } catch (err) {
      showToast(err?.message || 'Error al crear el Sheet', 'error')
    } finally {
      setCreatingSheet(false)
    }
  }

  const handleAddCC = async () => {
    if (!ccNombre.trim()) return showToast('El nombre es obligatorio', 'error')
    if (!ccEmail.trim()) return showToast('El email es obligatorio', 'error')
    setSavingCC(true)
    try {
      const nuevo = await api.post('/api/contactos-cc', { nombre: ccNombre.trim(), email: ccEmail.trim() })
      setContactosCC((prev) => [...prev, nuevo])
      setCcNombre('')
      setCcEmail('')
      setCcModalOpen(false)
      showToast('Contacto agregado')
    } catch (err) {
      showToast(err?.message || 'Error al agregar el contacto', 'error')
    } finally {
      setSavingCC(false)
    }
  }

  const handleDeleteCC = async (id) => {
    setDeletingCC(id)
    try {
      await api.delete(`/api/contactos-cc/${id}`)
      setContactosCC((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      showToast(err?.message || 'Error al eliminar el contacto', 'error')
    } finally {
      setDeletingCC(null)
    }
  }

  const handleSaveEmpresa = async () => {
    if (!empresaNombre.trim()) return showToast('El nombre de la empresa es obligatorio', 'error')
    setSavingEmpresa(true)
    try {
      await api.put('/api/config', { empresa_nombre: empresaNombre, empresa_email: empresaEmail, drive_folder_id: driveFolderId })
      showToast('Configuración guardada')
    } catch (err) {
      showToast(err?.message || 'Error al guardar', 'error')
    } finally {
      setSavingEmpresa(false)
    }
  }

  return {
    loading, Toast,
    googleConnected, googleEmail, googleNotConfigured, connectingGoogle, disconnectOpen, setDisconnectOpen, disconnecting, handleConnectGoogle, handleDisconnect,
    driveFolderId, setDriveFolderId, driveVerifyStatus, setDriveVerifyStatus, driveVerifyMsg, verifyingDrive, handleVerifyDrive,
    sheetsTab, setSheetsTab, sheetId, setSheetId, sheetVerifyStatus, setSheetVerifyStatus, verifyingSheet, handleVerifySheet, creatingSheet, handleCreateSheet, createdSheetId, createdSheetUrl,
    contactosCC, ccModalOpen, setCcModalOpen, ccNombre, setCcNombre, ccEmail, setCcEmail, savingCC, deletingCC, handleAddCC, handleDeleteCC,
    empresaNombre, setEmpresaNombre, empresaEmail, setEmpresaEmail, savingEmpresa, handleSaveEmpresa,
  }
}
