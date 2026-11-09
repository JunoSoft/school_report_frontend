import { useEffect, useState } from 'react'
import api from '../api/client'

export default function AuthImage({ path, alt = '', className, ...rest }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!path) {
      setSrc(null)
      return
    }
    let objectUrl
    let cancelled = false
    api.get('/files', { params: { path }, responseType: 'blob', skipLoading: true })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data)
        if (!cancelled) setSrc(objectUrl)
        else URL.revokeObjectURL(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [path])

  if (!src) return null
  return <img src={src} alt={alt} className={className} {...rest} />
}
