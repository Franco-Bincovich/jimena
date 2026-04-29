export default function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-[12.5px] text-text mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
