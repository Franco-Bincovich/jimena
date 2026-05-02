import Modal from './Modal'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-muted text-[13px] leading-relaxed mb-5">{description}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-muted hover:text-text text-[12.5px] transition-colors min-h-[36px]"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-[12.5px] font-medium rounded-md transition-colors min-h-[36px]"
          style={{ backgroundColor: 'var(--c-error-bg)', color: 'var(--c-error)', border: '0.5px solid var(--c-border-l)' }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
