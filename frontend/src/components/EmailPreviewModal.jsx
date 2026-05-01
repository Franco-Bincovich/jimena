import Modal from './Modal'

export default function EmailPreviewModal({ open, onClose, asunto, cuerpo, destinatario, adjunto }) {
  return (
    <Modal open={open} onClose={onClose} title="Vista previa del email" size="lg">
      <div className="flex flex-col gap-3">
        {/* Cabecera del email */}
        <div
          className="rounded-md p-3 flex flex-col gap-1.5"
          style={{ backgroundColor: '#141414', border: '0.5px solid #2A2A2A' }}
        >
          <div className="flex gap-2 text-[12px]">
            <span className="text-muted-dark w-14 flex-shrink-0">Para:</span>
            <span className="text-text">{destinatario?.email || '—'}</span>
          </div>
          {destinatario?.nombre && (
            <div className="flex gap-2 text-[12px]">
              <span className="text-muted-dark w-14 flex-shrink-0"></span>
              <span className="text-muted">{destinatario.nombre}</span>
            </div>
          )}
          <div className="flex gap-2 text-[12px]" style={{ borderTop: '0.5px solid #222', paddingTop: '6px', marginTop: '2px' }}>
            <span className="text-muted-dark w-14 flex-shrink-0">Asunto:</span>
            <span className="text-text font-medium">{asunto || '—'}</span>
          </div>
        </div>

        {/* Cuerpo */}
        <div
          className="rounded-md p-4"
          style={{ backgroundColor: '#1A1A1A', border: '0.5px solid #222' }}
        >
          <pre
            className="text-[13px] leading-7 m-0 font-sans"
            style={{ whiteSpace: 'pre-wrap', color: '#E8E8E8', lineHeight: '1.7' }}
          >
            {cuerpo || '(sin contenido)'}
          </pre>
        </div>

        {/* Adjunto */}
        {adjunto && (
          <div className="flex items-center gap-2">
            <span className="text-muted-dark text-[11.5px]">Adjunto:</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11.5px] font-mono"
              style={{ backgroundColor: '#0A2A0A', color: '#5CB85C', border: '0.5px solid #1A4A1A' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 9.5L8.5 3a2 2 0 00-2.83-2.83L1.17 5.17a3 3 0 004.24 4.24L9 5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              {adjunto}
            </span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted hover:text-text text-[12.5px] transition-colors min-h-[36px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
