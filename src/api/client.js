import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

let loadingHandlers = null

export function bindLoadingHandlers(handlers) {
  loadingHandlers = handlers
}

function beginLoading(config) {
  if (config?.skipLoading) return
  loadingHandlers?.start?.()
  config.__loadingTracked = true
}

function endLoading(config) {
  if (!config?.__loadingTracked) return
  loadingHandlers?.stop?.()
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const level = localStorage.getItem('selectedLevel')
  if (level) {
    config.headers['X-School-Level'] = level
  }
  beginLoading(config)
  return config
})

api.interceptors.response.use(
  (res) => {
    endLoading(res.config)
    return res
  },
  (error) => {
    endLoading(error.config)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export function fileUrl(path) {
  if (!path) return null
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  return `${base}/files?path=${encodeURIComponent(path)}`
}
