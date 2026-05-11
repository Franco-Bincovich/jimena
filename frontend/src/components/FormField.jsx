export default function FormField({ label, required, helper, children }) {
  return (
    <div>
      <label className="block text-[12.5px] text-text mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {helper && <p className="text-[11.5px] mt-1" style={{ color: 'var(--c-muted)' }}>{helper}</p>}
    </div>
  )
}
