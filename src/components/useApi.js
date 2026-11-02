import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Loads `path` and exposes data / error / loading plus a reload function. */
export function useApi(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      setData(await api(path))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload }
}
