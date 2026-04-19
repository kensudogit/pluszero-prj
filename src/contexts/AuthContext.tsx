import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Role, User } from '../types'
import { loadSession, loadUsers, saveSession, saveUsers, type Session } from '../storage/appStorage'

/** Self-registration allows these roles only (admin is not self-service). */
export const REGISTERABLE_ROLES: Role[] = ['staff', 'sales', 'manager']

export type RegisterInput = {
  name: string
  email: string
  password: string
  role: Role
}

export type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; code: 'duplicate' | 'invalid' | 'weak' }

type AuthState = {
  user: User | null
  users: User[]
  login: (email: string, password: string) => boolean
  logout: () => void
  register: (input: RegisterInput) => RegisterResult
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => loadUsers())
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const user = useMemo(() => {
    if (!session) return null
    return users.find((u) => u.id === session.userId) ?? null
  }, [session, users])

  const login = useCallback((email: string, password: string) => {
    const found = users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
    )
    if (!found) return false
    const next: Session = { userId: found.id }
    saveSession(next)
    setSession(next)
    return true
  }, [users])

  const logout = useCallback(() => {
    saveSession(null)
    setSession(null)
  }, [])

  const register = useCallback((input: RegisterInput): RegisterResult => {
    const name = input.name.trim()
    const emailNorm = input.email.trim().toLowerCase()
    if (!name || !emailNorm || !input.password) {
      return { ok: false, code: 'invalid' }
    }
    if (input.password.length < 8) {
      return { ok: false, code: 'weak' }
    }
    if (!REGISTERABLE_ROLES.includes(input.role) || input.role === 'admin') {
      return { ok: false, code: 'invalid' }
    }
    if (users.some((u) => u.email.trim().toLowerCase() === emailNorm)) {
      return { ok: false, code: 'duplicate' }
    }
    const newUser: User = {
      id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      email: input.email.trim(),
      name,
      role: input.role,
      password: input.password,
    }
    const next = [...users, newUser]
    setUsers(next)
    saveUsers(next)
    const nextSession: Session = { userId: newUser.id }
    saveSession(nextSession)
    setSession(nextSession)
    return { ok: true, user: newUser }
  }, [users])

  const value = useMemo(
    () => ({ user, users, login, logout, register }),
    [user, users, login, logout, register]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
