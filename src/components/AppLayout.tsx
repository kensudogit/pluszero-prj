import { NavLink, Outlet } from 'react-router-dom'
import type { Role } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { menuForRole, type MenuKey } from '../lib/permissions'

const labels: Record<MenuKey, { path: string; label: string }> = {
  dashboard: { path: '/', label: 'Dashboard' },
  cases: { path: '/cases', label: 'Cases' },
  tasks: { path: '/tasks', label: 'Tasks' },
  customers: { path: '/customers', label: 'Customers' },
  data: { path: '/data', label: 'Data' },
  notifications: { path: '/notifications', label: 'Alerts' },
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link active' : 'nav-link'
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const allowed = menuForRole(user?.role ?? ('staff' as Role))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">PZ</span>
          <span className="brand-name">PlusZero CRM</span>
        </div>
        <nav className="sidebar-nav">
          {allowed.map((key) => {
            const item = labels[key]
            const badge =
              key === 'notifications' && unreadCount > 0 ? (
                <span className="nav-badge">{unreadCount}</span>
              ) : null
            return (
              <NavLink key={key} to={item.path} className={navClass} end={key === 'dashboard'}>
                {item.label}
                {badge}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-block">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{roleLabel(user?.role)}</div>
          </div>
          <button type="button" className="btn ghost" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}

function roleLabel(role: Role | undefined) {
  if (!role) return ''
  const map: Record<Role, string> = {
    admin: 'Admin',
    manager: 'Manager',
    sales: 'Sales',
    staff: 'Staff',
  }
  return map[role]
}
