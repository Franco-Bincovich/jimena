import { useEffect, useRef, useState } from 'react'

export function Toast({ message, type = 'success', visible }) {
  if (!visible || !message) return null

  const styles =
    type === 'success'
      ? 'bg-[#0F2A0F] border border-[#1E4A1E] text-[#5CB85C]'
      : 'bg-[#2A0F0F] border border-[#4A1E1E] text-[#E07070]'

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-[13px] max-w-sm ${styles}`}
    >
      {type === 'success' ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M2 7.5L6 11.5L13 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M7.5 2v5.5M7.5 11v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span>{message}</span>
    </div>
  )
}

export function useToast() {
  const [state, setState] = useState({ message: '', type: 'success', visible: false })
  const timerRef = useRef(null)

  const showToast = (message, type = 'success') => {
    clearTimeout(timerRef.current)
    setState({ message, type, visible: true })
    timerRef.current = setTimeout(() => {
      setState((s) => ({ ...s, visible: false }))
    }, 3000)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const ToastComponent = () => (
    <Toast message={state.message} type={state.type} visible={state.visible} />
  )

  return { showToast, Toast: ToastComponent }
}
