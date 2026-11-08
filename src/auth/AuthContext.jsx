import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [selectedLevel, setSelectedLevelState] = useState(() => localStorage.getItem('selectedLevel'))
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    const levels = data.user.levels || []
    if (levels.length === 1) {
      setSelectedLevel(levels[0])
    } else {
      setSelectedLevelState(null)
      localStorage.removeItem('selectedLevel')
    }
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('selectedLevel')
    setUser(null)
    setSelectedLevelState(null)
  }

  const setSelectedLevel = (level) => {
    setSelectedLevelState(level)
    if (level) localStorage.setItem('selectedLevel', level)
    else localStorage.removeItem('selectedLevel')
  }

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    selectedLevel,
    setSelectedLevel,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isParent: user?.role === 'PARENT',
  }), [user, loading, selectedLevel])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
