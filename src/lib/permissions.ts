import type { Role } from '../types'

export type MenuKey =
  | 'dashboard'
  | 'reports'
  | 'portal'
  | 'cases'
  | 'tasks'
  | 'customers'
  | 'data'
  | 'notifications'

const roleMenus: Record<Role, MenuKey[]> = {
  admin: ['dashboard', 'reports', 'portal', 'cases', 'tasks', 'customers', 'data', 'notifications'],
  manager: ['dashboard', 'reports', 'portal', 'cases', 'tasks', 'customers', 'data', 'notifications'],
  sales: ['dashboard', 'reports', 'portal', 'cases', 'tasks', 'customers', 'notifications'],
  staff: ['dashboard', 'reports', 'portal', 'cases', 'tasks', 'notifications'],
}

export function menuForRole(role: Role): MenuKey[] {
  return roleMenus[role]
}

/** Revenue, cost, profit breakdown */
export function canViewFinanceDetail(role: Role): boolean {
  return role === 'admin' || role === 'manager'
}

/** Revenue only (no cost/profit) */
export function canViewRevenueOnly(role: Role): boolean {
  return role === 'sales'
}

export function canEditCases(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'sales'
}

export function canEditCustomers(role: Role): boolean {
  return role === 'admin' || role === 'manager' || role === 'sales'
}

export function canImportCsv(role: Role): boolean {
  return role === 'admin' || role === 'manager'
}

export function canExportCsv(role: Role): boolean {
  return role !== 'staff'
}

export function canManageAllTasks(role: Role): boolean {
  return role === 'admin' || role === 'manager'
}
