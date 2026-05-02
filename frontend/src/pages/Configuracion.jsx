import ConfirmDialog from '../components/ConfirmDialog'
import { DriveSection, EmpresaSection, GoogleSection } from '../components/ConfiguracionGDE'
import { ContactosCCModal, ContactosCCSection, SheetsSection } from '../components/ConfiguracionSCC'
import { IconWarn } from '../components/ConfiguracionIcons'
import { useConfiguracion } from '../hooks/useConfiguracion'

export default function Configuracion() {
  const cfg = useConfiguracion()

  const checks = [
    { key: 'google', label: 'Conectá tu cuenta de Google', done: cfg.googleConnected },
    { key: 'drive', label: 'Configurá la carpeta de Drive', done: cfg.driveVerifyStatus === 'ok' },
    { key: 'sheet', label: 'Configurá el Sheet de registro', done: cfg.sheetVerifyStatus === 'ok' },
    { key: 'empresa', label: 'Completá los datos de la empresa', done: !!cfg.empresaNombre.trim() },
  ]
  const allDone = checks.every((c) => c.done)

  if (cfg.loading) {
    return (
      <div className="flex flex-col gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg p-5 animate-pulse" style={{ backgroundColor: 'var(--c-surface)', border: '0.5px solid var(--c-border)' }}>
            <div className="h-3 bg-surface-hover rounded w-40 mb-5" />
            <div className="h-8 bg-surface-hover rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <cfg.Toast />
      <div className="mb-6">
        <h1 className="text-text font-semibold text-xl md:text-2xl mb-0.5">Configuración</h1>
        <p className="text-muted text-[12.5px]">Conectá Google y configurá Drive y Sheets para usar el sistema</p>
      </div>

      {allDone ? (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg mb-5 text-[13px]" style={{ backgroundColor: 'var(--c-ok-bg)', border: '0.5px solid var(--c-ok-border)', color: 'var(--c-ok-text)' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Sistema configurado y listo para usar
        </div>
      ) : (
        <div className="px-4 py-3 rounded-lg mb-5" style={{ backgroundColor: 'var(--c-surface)', border: '0.5px solid var(--c-border-l)' }}>
          <p className="text-[12px] text-muted-dark mb-2 uppercase tracking-wider">Pasos pendientes</p>
          <div className="flex flex-col gap-1.5">
            {checks.filter((c) => !c.done).map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--c-warn-text)' }}>
                <IconWarn />
                {c.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        <GoogleSection
          googleConnected={cfg.googleConnected} googleEmail={cfg.googleEmail}
          googleNotConfigured={cfg.googleNotConfigured} connectingGoogle={cfg.connectingGoogle}
          handleConnectGoogle={cfg.handleConnectGoogle} setDisconnectOpen={cfg.setDisconnectOpen}
        />
        <DriveSection
          driveFolderId={cfg.driveFolderId} setDriveFolderId={cfg.setDriveFolderId}
          driveVerifyStatus={cfg.driveVerifyStatus} setDriveVerifyStatus={cfg.setDriveVerifyStatus}
          driveVerifyMsg={cfg.driveVerifyMsg} verifyingDrive={cfg.verifyingDrive}
          handleVerifyDrive={cfg.handleVerifyDrive}
        />
        <SheetsSection
          sheetsTab={cfg.sheetsTab} setSheetsTab={cfg.setSheetsTab}
          sheetId={cfg.sheetId} setSheetId={cfg.setSheetId}
          sheetVerifyStatus={cfg.sheetVerifyStatus} setSheetVerifyStatus={cfg.setSheetVerifyStatus}
          verifyingSheet={cfg.verifyingSheet} handleVerifySheet={cfg.handleVerifySheet}
          creatingSheet={cfg.creatingSheet} handleCreateSheet={cfg.handleCreateSheet}
          createdSheetId={cfg.createdSheetId} createdSheetUrl={cfg.createdSheetUrl}
          googleConnected={cfg.googleConnected}
        />
        <ContactosCCSection
          contactosCC={cfg.contactosCC} handleDeleteCC={cfg.handleDeleteCC}
          deletingCC={cfg.deletingCC} setCcModalOpen={cfg.setCcModalOpen}
        />
        <EmpresaSection
          empresaNombre={cfg.empresaNombre} setEmpresaNombre={cfg.setEmpresaNombre}
          empresaEmail={cfg.empresaEmail} setEmpresaEmail={cfg.setEmpresaEmail}
          savingEmpresa={cfg.savingEmpresa} handleSaveEmpresa={cfg.handleSaveEmpresa}
        />
      </div>

      <ContactosCCModal
        ccModalOpen={cfg.ccModalOpen} savingCC={cfg.savingCC}
        ccNombre={cfg.ccNombre} setCcNombre={cfg.setCcNombre}
        ccEmail={cfg.ccEmail} setCcEmail={cfg.setCcEmail}
        handleAddCC={cfg.handleAddCC} setCcModalOpen={cfg.setCcModalOpen}
      />
      <ConfirmDialog
        open={cfg.disconnectOpen}
        onClose={() => !cfg.disconnecting && cfg.setDisconnectOpen(false)}
        onConfirm={cfg.handleDisconnect}
        title="Desconectar Google"
        description="¿Desconectás tu cuenta de Google? El sistema dejará de poder enviar emails y acceder a Drive hasta que vuelvas a conectar."
        confirmLabel="Sí, desconectar"
      />
    </div>
  )
}
