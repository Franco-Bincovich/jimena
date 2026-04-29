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
          style={{ backgroundColor: '#2A0F0F', color: '#E07070', border: '0.5px solid #4A1E1E' }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
