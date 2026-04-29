import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

export function usePreview({ endpoint, params, enabled }) {
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const lastValidRef = useRef({ asunto: '', cuerpo: '' })

  useEffect(() => {
    if (!enabled) return

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      console.log('Preview params:', params)
      try {
        const res = await api.post(endpoint, params)
        console.log('Preview response:', res)
        setAsunto(res.asunto)
        setCuerpo(res.cuerpo)
        lastValidRef.current = { asunto: res.asunto, cuerpo: res.cuerpo }
        setError(null)
      } catch (err) {
        console.log('Preview error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [enabled, endpoint, JSON.stringify(params)])

  return { asunto, cuerpo, setAsunto, setCuerpo, loading, error }
}
