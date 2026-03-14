import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, verify token and load user
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) { setLoading(false); return }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
      } catch {
        localStorage.removeItem('accessToken')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const value = { user, loading, login, register, logout, setUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
