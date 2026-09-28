import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { tokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(tokens.access))

  useEffect(() => {
    if (tokens.access) {
      authApi
        .me()
        .then(setUser)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    const onForcedLogout = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener('auth:logout', onForcedLogout)
    return () => window.removeEventListener('auth:logout', onForcedLogout)
  }, [queryClient])

  const login = async (credentials) => {
    tokens.set(await authApi.login(credentials))
    const me = await authApi.me()
    setUser(me)
    queryClient.invalidateQueries()
    return me
  }

  const register = async (body) => {
    const result = await authApi.register(body)
    tokens.set(result)
    setUser(result.user)
    queryClient.invalidateQueries()
    return result.user
  }

  const logout = async () => {
    try {
      if (tokens.refresh) await authApi.logout(tokens.refresh)
    } catch {
      // Token may already be expired or blacklisted; logging out locally is enough.
    }
    tokens.clear()
    setUser(null)
    queryClient.clear()
  }

  const value = { user, loading, isVendor: user?.role === 'vendor', login, register, logout, setUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
