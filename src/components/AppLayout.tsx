import { NavLink, Outlet } from 'react-router-dom'
import type { Role } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { menuForRole, type MenuKey } from '../lib/permissions'
import { ja } from '../locales'
import { QuickSearch } from './QuickSearch'

const LOGO_SRC = '/pc.png'

const paths: Record<MenuKey, string> = {
  dashboard: '/',
  cases: '/cases',
  tasks: '/tasks',
  customers: '/customers',
  data: '/data',
  notifications: '/notifications',
}

const labels: Record<MenuKey, string> = {
  dashboard: ja.nav.dashboard,
  cases: ja.nav.cases,
  tasks: ja.nav.tasks,
  customers: ja.nav.customers,
  data: ja.nav.data,
  notifications: ja.nav.notifications,
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
          <img src={LOGO_SRC} alt="" className="brand-logo" width={36} height={36} decoding="async" />
          <span className="brand-name">{ja.login.title}</span>
        </div>
        <nav className="sidebar-nav">
          {allowed.map((key) => {
            const label = labels[key]
            const badge =
              key === 'notifications' && unreadCount > 0 ? (
                <span className="nav-badge">{unreadCount}</span>
              ) : null
            return (
              <NavLink key={key} to={paths[key]} className={navClass} end={key === 'dashboard'}>
                {label}
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
            {ja.common.signOut}
          </button>
        </div>
      </aside>
      <main className="main-area">
        <div className="main-toolbar">
          <QuickSearch />
        </div>
        <Outlet />
      </main>
    </div>
  )
}

function roleLabel(role: Role | undefined) {
  if (!role) return ''
  const map: Record<Role, string> = {
    admin: ja.roles.admin,
    manager: ja.roles.manager,
    sales: ja.roles.sales,
    staff: ja.roles.staff,
  }
  return map[role]
}
