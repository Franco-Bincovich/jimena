import ConfirmDialog from '../components/ConfirmDialog'
import FacturaConfirmModal from '../components/FacturaConfirmModal'
import { CardSkeleton, fmtFecha, fmtMonto, FacturasTodasTab, GmailBuscarSection, PendienteBadge } from '../components/FacturasUI'
import { useFacturas } from '../hooks/useFacturas'

export default function Facturas() {
  const {
    pendientes, todas, loading, searching, googleConnected, activeTab, setActiveTab,
    proveedores, clientes, confirmModal, setConfirmModal, confirmForm, saving,
    deleteModal, setDeleteModal, Toast, handleBuscar,
    openConfirmar, toggleCliente, setField, handleConfirmar, handleDelete,
  } = useFacturas()

  return (
    <div>
      <Toast />
      <div className="mb-6">
        <h1 className="text-text font-semibold text-xl md:text-2xl mb-0.5">Facturas recibidas</h1>
        <p className="text-muted text-[12.5px]">Procesá las facturas de Gmail y confirmá su carga en Drive</p>
      </div>

      <GmailBuscarSection googleConnected={googleConnected} searching={searching} handleBuscar={handleBuscar} />

      <div>
        <div className="flex" style={{ borderBottom: '0.5px solid var(--c-border)' }}>
          {[
            { key: 'pendientes', label: `Pendientes de confirmar (${pendientes.length})` },
            { key: 'todas', label: `Todas (${todas.length})` },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-[12.5px] transition-colors ${activeTab === tab.key ? 'text-text' : 'text-muted-dark hover:text-muted'}`} style={activeTab === tab.key ? { borderBottom: '2px solid #FF6B00', marginBottom: '-1px' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === 'pendientes' && (
            loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3"><CardSkeleton /></div>
            ) : pendientes.length === 0 ? (
              <div className="py-12 text-center text-muted text-[12.5px]">No hay facturas pendientes de confirmar</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pendientes.map((f) => (
                  <div key={f.id} className="bg-surface rounded-lg flex flex-col" style={{ border: '0.5px solid var(--c-border)' }}>
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <code className="text-primary text-[12px] break-all leading-tight">{f.nombre_archivo}</code>
                        <PendienteBadge />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[['Proveedor', f.proveedor?.nombre || '—', false], ['N° Factura', f.numero_factura || '—', true], ['Fecha', fmtFecha(f.fecha_factura), false], ['Monto', fmtMonto(f.monto_total), false]].map(([label, value, mono]) => (
                          <div key={label}>
                            <p className="text-muted-dark text-[11px] mb-0.5">{label}</p>
                            <p className={`text-text text-[12px] ${mono ? 'font-mono' : ''}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {f.clientes?.length > 0 && (
                        <div className="mt-2 pt-2" style={{ borderTop: '0.5px solid var(--c-border-s)' }}>
                          <span className="text-muted-dark text-[11px]">Clientes detectados: </span>
                          <span className="text-muted text-[12px]">{f.clientes.map((c) => c.nombre).join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 flex gap-2" style={{ borderTop: '0.5px solid #222' }}>
                      <button onClick={() => openConfirmar(f)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-[12px] font-medium rounded-md transition-colors min-h-[36px]">Confirmar y subir a Drive</button>
                      <button onClick={() => setDeleteModal({ open: true, factura: f, mode: 'discard' })} className="px-3 py-1.5 text-muted hover:text-error text-[12px] rounded-md transition-colors min-h-[36px]">Descartar</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'todas' && <FacturasTodasTab loading={loading} todas={todas} setDeleteModal={setDeleteModal} />}
        </div>
      </div>

      <FacturaConfirmModal
        open={confirmModal.open} saving={saving} confirmForm={confirmForm}
        setField={setField} toggleCliente={toggleCliente}
        proveedores={proveedores} clientes={clientes}
        onClose={() => setConfirmModal({ open: false, factura: null })}
        onConfirm={handleConfirmar}
      />
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, factura: null, mode: 'delete' })}
        onConfirm={handleDelete}
        title={deleteModal.mode === 'discard' ? 'Descartar factura' : 'Eliminar factura'}
        description={deleteModal.mode === 'discard' ? `¿Descartás la factura "${deleteModal.factura?.nombre_archivo}"? Se eliminará el archivo.` : `Vas a eliminar "${deleteModal.factura?.nombre_archivo}". Esta acción no se puede deshacer.`}
        confirmLabel={deleteModal.mode === 'discard' ? 'Sí, descartar' : 'Sí, eliminar'}
      />
    </div>
  )
}
