import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { menuForRole, type MenuKey } from '../lib/permissions'

export function RequireAccess({ menuKey, children }: { menuKey: MenuKey; children: ReactNode }) {
  const { user } = useAuth()
  const role = user?.role ?? ('staff' as Role)
  const allowed = menuForRole(role)
  if (!allowed.includes(menuKey)) {
    return <Navigate to="/" replace />
  }
  return children
}
