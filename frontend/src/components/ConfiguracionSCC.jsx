import { CardHeader, IconSheets, IconUsers, InstruccionBox, SHEET_COLS, Spinner, VerifyBadge } from './ConfiguracionIcons'

export function SheetsSection({ sheetsTab, setSheetsTab, sheetId, setSheetId, sheetVerifyStatus, setSheetVerifyStatus, verifyingSheet, handleVerifySheet, creatingSheet, handleCreateSheet, createdSheetId, createdSheetUrl, googleConnected }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <CardHeader icon={<IconSheets />} title="Registro en Sheets" />
      <div className="flex mb-5" style={{ borderBottom: '0.5px solid #222' }}>
        {[{ key: 'existing', label: 'Usar un Sheet existente' }, { key: 'new', label: 'Crear uno nuevo' }].map((tab) => (
          <button key={tab.key} onClick={() => setSheetsTab(tab.key)} className={`px-4 py-2 text-[12.5px] transition-colors ${sheetsTab === tab.key ? 'text-text' : 'text-muted-dark hover:text-muted'}`} style={sheetsTab === tab.key ? { borderBottom: '2px solid #FF6B00', marginBottom: '-1px' } : {}}>
            {tab.label}
          </button>
        ))}
      </div>
      {sheetsTab === 'existing' ? (
        <div>
          <InstruccionBox>
            <ol className="list-none m-0 p-0 flex flex-col gap-1">
              <li><span style={{ color: '#FF6B00' }}>1.</span> Abrí el Google Sheet donde querés registrar las facturas</li>
              <li><span style={{ color: '#FF6B00' }}>2.</span> Copiá el ID que aparece en la URL:</li>
              <li className="pl-3"><code className="font-mono text-[11.5px]" style={{ color: '#555' }}>docs.google.com/spreadsheets/d/<span style={{ color: '#FF6B00', fontWeight: 600 }}>[ESTE-ES-EL-ID]</span>/edit</code></li>
              <li><span style={{ color: '#FF6B00' }}>3.</span> Pegalo en el campo de abajo</li>
            </ol>
          </InstruccionBox>
          <div className="mb-4">
            <label className="block text-[12.5px] text-text mb-1.5">ID del Google Sheet</label>
            <div className="flex gap-2">
              <input value={sheetId} onChange={(e) => { setSheetId(e.target.value); setSheetVerifyStatus(null) }} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74tLkh3" className="flex-1" />
              <button onClick={handleVerifySheet} disabled={verifyingSheet || !sheetId.trim()} className="flex items-center gap-2 px-4 py-2 text-muted hover:text-text text-[12.5px] rounded-md transition-colors min-h-[36px] disabled:opacity-50 flex-shrink-0" style={{ border: '0.5px solid #2A2A2A' }}>
                {verifyingSheet ? <><Spinner /> Verificando…</> : 'Verificar acceso'}
              </button>
            </div>
            {sheetVerifyStatus && <div className="mt-2"><VerifyBadge status={sheetVerifyStatus} /></div>}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-muted text-[13px] leading-relaxed mb-4">Creamos un Sheet nuevo en tu Drive con los encabezados ya configurados, listo para empezar a registrar facturas.</p>
          {createdSheetId ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-md" style={{ backgroundColor: '#0A2A0A', border: '0.5px solid #1A4A1A' }}>
              <div>
                <p className="text-[12px] text-muted-dark mb-0.5">Sheet creado</p>
                <code className="text-[12px] font-mono" style={{ color: '#5CB85C' }}>{createdSheetId}</code>
              </div>
              {createdSheetUrl && <a href={createdSheetUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] underline transition-opacity hover:opacity-80" style={{ color: '#5CB85C' }}>Abrir Sheet ↗</a>}
            </div>
          ) : (
            <button onClick={handleCreateSheet} disabled={creatingSheet || !googleConnected} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]">
              {creatingSheet ? <><Spinner white /> Creando…</> : 'Crear Sheet automáticamente'}
            </button>
          )}
        </div>
      )}
      <div className="mt-5 rounded-md p-3" style={{ backgroundColor: '#111', border: '0.5px solid #1A1A1A' }}>
        <p className="text-muted-dark text-[11px] uppercase tracking-wider mb-2">Columnas que se van a registrar</p>
        <div className="flex flex-wrap gap-1.5">
          {SHEET_COLS.map((col) => (
            <span key={col} className="px-2 py-0.5 rounded text-[11px] font-mono" style={{ backgroundColor: '#1A1A1A', color: '#555', border: '0.5px solid #222' }}>{col}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ContactosCCSection({ contactosCC, handleDeleteCC, deletingCC, setCcModalOpen }) {
  return (
    <div className="p-5 rounded-lg" style={{ backgroundColor: '#171717', border: '0.5px solid #222' }}>
      <CardHeader icon={<IconUsers />} title="Contactos en copia" />
      <p className="text-muted text-[12.5px] mb-4">Estas personas aparecen como opción en el selector de CC cuando enviás emails. Podés activarlos o desactivarlos por envío.</p>
      {contactosCC.length > 0 && (
        <div className="rounded-md mb-4 overflow-hidden" style={{ border: '0.5px solid #2A2A2A' }}>
          {contactosCC.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2.5" style={{ borderTop: i > 0 ? '0.5px solid #1E1E1E' : undefined, backgroundColor: '#141414' }}>
              <div className="min-w-0">
                <span className="text-text text-[12.5px]">{c.nombre}</span>
                <span className="text-muted-dark text-[12px] ml-2">{c.email}</span>
              </div>
              <button type="button" onClick={() => handleDeleteCC(c.id)} disabled={deletingCC === c.id} className="p-1.5 text-muted hover:text-error transition-colors disabled:opacity-40 flex-shrink-0 ml-3" title="Eliminar">
                {deletingCC === c.id ? (
                  <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: '#333', borderTopColor: '#888' }} />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
      {contactosCC.length === 0 && <p className="text-muted-dark text-[12px] mb-4">No hay contactos guardados.</p>}
      <button type="button" onClick={() => setCcModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-muted hover:text-text text-[12px] rounded-md transition-colors" style={{ border: '0.5px solid #2A2A2A' }}>+ Agregar contacto</button>
    </div>
  )
}

export function ContactosCCModal({ ccModalOpen, savingCC, ccNombre, setCcNombre, ccEmail, setCcEmail, handleAddCC, setCcModalOpen }) {
  if (!ccModalOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={(e) => { if (e.target === e.currentTarget && !savingCC) setCcModalOpen(false) }}>
      <div className="w-full max-w-sm rounded-lg p-5 flex flex-col gap-4" style={{ backgroundColor: '#171717', border: '0.5px solid #2A2A2A' }}>
        <h3 className="text-text text-[14px] font-medium">Agregar contacto en copia</h3>
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Nombre <span className="text-error">*</span></label>
          <input value={ccNombre} onChange={(e) => setCcNombre(e.target.value)} placeholder="Nombre completo" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddCC()} />
        </div>
        <div>
          <label className="block text-[12.5px] text-text mb-1.5">Email <span className="text-error">*</span></label>
          <input type="email" value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} placeholder="contacto@empresa.com" onKeyDown={(e) => e.key === 'Enter' && handleAddCC()} />
        </div>
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={() => { setCcModalOpen(false); setCcNombre(''); setCcEmail('') }} disabled={savingCC} className="px-3 py-1.5 text-muted hover:text-text text-[12.5px] rounded-md transition-colors disabled:opacity-50" style={{ border: '0.5px solid #2A2A2A' }}>Cancelar</button>
          <button type="button" onClick={handleAddCC} disabled={savingCC} className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors">
            {savingCC ? <><Spinner white /> Guardando…</> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
