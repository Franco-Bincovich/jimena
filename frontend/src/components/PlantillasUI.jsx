export const VARS = {
  pedido: ['proveedor', 'mes', 'año', 'fecha_desde', 'fecha_hasta', 'empresa_remitente', 'clientes'],
  envio: ['nombre_destinatario', 'cliente', 'empresa_remitente', 'proveedor', 'mes', 'año', 'numero_factura', 'fecha_factura', 'fecha_desde', 'fecha_hasta', 'monto_total', 'clientes_con_montos'],
}

export function TypeBadge({ tipo }) {
  return tipo === 'pedido' ? (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: 'var(--c-warn-bg)', color: 'var(--c-warn-text)', border: '0.5px solid var(--c-warn-border)' }}>pedido</span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: 'var(--c-ok-bg)', color: 'var(--c-ok-text)', border: '0.5px solid var(--c-ok-border)' }}>envío</span>
  )
}

function CardSkeleton() {
  return Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="bg-surface rounded-lg p-4 animate-pulse" style={{ border: '0.5px solid var(--c-border)' }}>
      <div className="flex justify-between mb-3">
        <div className="h-3.5 bg-surface-hover rounded w-32" />
        <div className="h-4 bg-surface-hover rounded w-14" />
      </div>
      <div className="h-3 bg-surface-hover rounded w-full mb-2" />
      <div className="h-3 bg-surface-hover rounded w-4/5" />
    </div>
  ))
}

export function PlantillasSection({ title, items, onEdit, onDelete, loading }) {
  return (
    <div className="mb-8">
      <h2 className="text-text text-[13px] font-medium mb-3">
        {title} <span className="text-muted-dark ml-2 font-normal">({items.length})</span>
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"><CardSkeleton /></div>
      ) : items.length === 0 ? (
        <p className="text-muted text-[12.5px] py-4">No hay plantillas de este tipo.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div key={p.id} className="bg-surface rounded-lg flex flex-col" style={{ border: '0.5px solid var(--c-border)' }}>
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-text text-[13px] font-medium leading-tight">{p.nombre}</span>
                  <TypeBadge tipo={p.tipo} />
                </div>
                <p className="text-muted text-[12px] mb-1.5 leading-tight">{p.asunto}</p>
                <p className="text-muted-dark text-[12px] leading-relaxed">
                  {p.cuerpo.length > 80 ? p.cuerpo.slice(0, 80) + '…' : p.cuerpo}
                </p>
              </div>
              <div className="px-4 py-2.5 flex gap-1" style={{ borderTop: '0.5px solid var(--c-border)' }}>
                <button onClick={() => onEdit(p)} className="px-2.5 py-1.5 text-muted hover:text-text text-[12px] rounded transition-colors min-h-[36px]">Editar</button>
                <button onClick={() => onDelete(p)} className="px-2.5 py-1.5 text-error hover:opacity-80 text-[12px] rounded transition-colors min-h-[36px]">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
