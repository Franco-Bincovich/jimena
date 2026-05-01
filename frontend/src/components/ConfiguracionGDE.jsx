import { CardHeader, IconBuilding, IconCheck, IconDrive, IconGoogle, InstruccionBox, Spinner, VerifyBadge } from './ConfiguracionIcons'

export function GoogleSection({ googleConnected, googleEmail, googleNotConfigured, connectingGoogle, handleConnectGoogle, setDisconnectOpen }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <CardHeader icon={<IconGoogle />} title="Conectar con Google" />
      {googleConnected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCheck />
            <div>
              <p className="text-text text-[13px]">Conectado</p>
              {googleEmail && <p className="text-muted-dark text-[12px]">{googleEmail}</p>}
            </div>
          </div>
          <button onClick={() => setDisconnectOpen(true)} className="px-3 py-1.5 text-muted hover:text-error text-[12px] rounded-md transition-colors min-h-[36px]" style={{ border: '0.5px solid #2A2A2A' }}>Desconectar</button>
        </div>
      ) : googleNotConfigured ? (
        <div className="flex items-start gap-2.5 px-3 py-3 rounded-md text-[12.5px]" style={{ backgroundColor: '#1E1800', border: '0.5px solid #3A3000', color: '#D4920A' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7.5 4.5v3.5M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          El sistema no está configurado. Contactá al administrador.
        </div>
      ) : (
        <div>
          <p className="text-muted text-[13px] leading-relaxed mb-5">Conectá tu cuenta de Google para habilitar el envío de emails, el guardado en Drive y el registro en Sheets.</p>
          <div className="flex justify-center">
            <button onClick={handleConnectGoogle} disabled={connectingGoogle} className="flex items-center justify-center gap-2.5 py-2.5 rounded-lg transition-colors disabled:opacity-60 min-h-[44px]" style={{ width: '260px', backgroundColor: '#ffffff', color: '#111111', border: '1px solid #333', fontSize: '13px', fontWeight: 500 }}>
              {connectingGoogle ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#ccc', borderTopColor: '#333' }} /> : <IconGoogle />}
              Conectar con Google
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DriveSection({ driveFolderId, setDriveFolderId, driveVerifyStatus, setDriveVerifyStatus, driveVerifyMsg, verifyingDrive, handleVerifyDrive }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <CardHeader icon={<IconDrive />} title="Carpeta de Drive" />
      <InstruccionBox>
        <ol className="list-none m-0 p-0 flex flex-col gap-1">
          <li><span style={{ color: '#FF6B00' }}>1.</span> Abrí Google Drive en tu navegador</li>
          <li><span style={{ color: '#FF6B00' }}>2.</span> Creá una carpeta nueva llamada <code className="font-mono" style={{ color: '#E0E0E0' }}>Facturas</code></li>
          <li><span style={{ color: '#FF6B00' }}>3.</span> Abrí esa carpeta y copiá el ID que aparece en la URL:</li>
          <li className="pl-3"><code className="font-mono text-[11.5px]" style={{ color: '#555' }}>drive.google.com/drive/folders/<span style={{ color: '#FF6B00', fontWeight: 600 }}>[ESTE-ES-EL-ID]</span></code></li>
          <li><span style={{ color: '#FF6B00' }}>4.</span> Pegalo en el campo de abajo</li>
        </ol>
      </InstruccionBox>
      <div className="mb-4">
        <label className="block text-[12.5px] text-text mb-1.5">ID de la carpeta raíz en Drive</label>
        <div className="flex gap-2">
          <input value={driveFolderId} onChange={(e) => { setDriveFolderId(e.target.value); setDriveVerifyStatus(null) }} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs" className="flex-1" />
          <button onClick={handleVerifyDrive} disabled={verifyingDrive || !driveFolderId.trim()} className="flex items-center gap-2 px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[36px] disabled:opacity-50 flex-shrink-0" style={{ border: '0.5px solid #2A2A2A' }}>
            {verifyingDrive ? <><Spinner /> Verificando…</> : 'Verificar acceso'}
          </button>
        </div>
        {driveVerifyStatus && (
          <div className="mt-2 flex items-center gap-2">
            <VerifyBadge status={driveVerifyStatus} />
            {driveVerifyStatus === 'error' && driveVerifyMsg && <span className="text-error text-[12px]">{driveVerifyMsg}</span>}
          </div>
        )}
      </div>
      <div className="rounded-md p-3" style={{ backgroundColor: '#111', border: '0.5px solid #1A1A1A' }}>
        <p className="text-muted-dark text-[11px] uppercase tracking-wider mb-2">Estructura de carpetas que se va a crear</p>
        <pre className="text-[12px] m-0 font-mono leading-6" style={{ color: '#555' }}>{`📁 Facturas/\n   📁 {nombre del proveedor}/`}</pre>
      </div>
    </div>
  )
}

export function EmpresaSection({ empresaNombre, setEmpresaNombre, empresaEmail, setEmpresaEmail, savingEmpresa, handleSaveEmpresa }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <CardHeader icon={<IconBuilding />} title="Datos de la empresa" />
      <p className="text-muted text-[12.5px] mb-4">Este nombre aparece como remitente en todos los emails que envía el sistema.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Nombre de la empresa <span className="text-error">*</span></label>
          <input value={empresaNombre} onChange={(e) => setEmpresaNombre(e.target.value)} placeholder="Mi Empresa S.A." />
        </div>
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Email de contacto</label>
          <input type="email" value={empresaEmail} onChange={(e) => setEmpresaEmail(e.target.value)} placeholder="admin@miempresa.com" />
          <p className="text-muted-dark text-[11.5px] mt-1">Tiene que ser el email de la cuenta Google conectada</p>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleSaveEmpresa} disabled={savingEmpresa} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">
          {savingEmpresa ? <><Spinner white /> Guardando…</> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
