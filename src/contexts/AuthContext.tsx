import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { loadSession, loadUsers, saveSession, type Session } from '../storage/appStorage'

type AuthState = {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const users = useMemo(() => loadUsers(), [])
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const user = useMemo(() => {
    if (!session) return null
    return users.find((u) => u.id === session.userId) ?? null
  }, [session, users])

  const login = useCallback(
    (email: string, password: string) => {
      const found = users.find(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
      )
      if (!found) return false
      const next: Session = { userId: found.id }
      saveSession(next)
      setSession(next)
      return true
    },
    [users]
  )

  const logout = useCallback(() => {
    saveSession(null)
    setSession(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
