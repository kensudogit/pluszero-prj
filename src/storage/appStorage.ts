import type { AppData, AppNotification, User } from '../types'

const KEYS = {
  data: 'pz_app_data',
  users: 'pz_users',
  session: 'pz_session',
  notifications: 'pz_notifications',
} as const

const demoUsers: User[] = [
  {
    id: 'u-admin',
    email: 'admin@demo.com',
    name: 'Admin',
    role: 'admin',
    password: 'demo123',
  },
  {
    id: 'u-manager',
    email: 'manager@demo.com',
    name: 'Manager',
    role: 'manager',
    password: 'demo123',
  },
  {
    id: 'u-sales',
    email: 'sales@demo.com',
    name: 'Sales',
    role: 'sales',
    password: 'demo123',
  },
  {
    id: 'u-staff',
    email: 'staff@demo.com',
    name: 'Staff',
    role: 'staff',
    password: 'demo123',
  },
]

function seedData(): AppData {
  const now = new Date()
  const ym = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

  const m0 = new Date(now.getFullYear(), now.getMonth() - 2, 15)
  const m1 = new Date(now.getFullYear(), now.getMonth() - 1, 10)
  const m2 = new Date(now.getFullYear(), now.getMonth(), 5)

  return {
    customers: [
      {
        id: 'c1',
        name: 'Taro Yamada',
        company: 'Alpha Corporation',
        email: 'yamada@alpha.example',
        phone: '03-0000-1111',
        note: 'Key account',
      },
      {
        id: 'c2',
        name: 'Hanako Sato',
        company: 'Beta Trading',
        email: 'sato@beta.example',
        phone: '06-2222-3333',
        note: '',
      },
      {
        id: 'c3',
        name: 'Makoto Ito',
        company: 'Gamma Industries',
        email: 'ito@gamma.example',
        phone: '092-444-5555',
        note: 'Many quotes',
      },
    ],
    cases: [
      {
        id: 'k1',
        title: 'Core system renewal',
        customerId: 'c1',
        status: 'active',
        revenue: 8_500_000,
        cost: 5_200_000,
        period: ym(m0),
        updatedAt: m0.toISOString(),
      },
      {
        id: 'k2',
        title: 'Process improvement',
        customerId: 'c2',
        status: 'closed',
        revenue: 3_200_000,
        cost: 1_800_000,
        period: ym(m1),
        updatedAt: m1.toISOString(),
      },
      {
        id: 'k3',
        title: 'Cloud migration support',
        customerId: 'c1',
        status: 'active',
        revenue: 4_500_000,
        cost: 2_900_000,
        period: ym(m2),
        updatedAt: m2.toISOString(),
      },
      {
        id: 'k4',
        title: 'Data platform PoC',
        customerId: 'c3',
        status: 'draft',
        revenue: 0,
        cost: 400_000,
        period: ym(m2),
        updatedAt: m2.toISOString(),
      },
    ],
    tasks: [
      {
        id: 't1',
        title: 'Kickoff deck',
        caseId: 'k1',
        status: 'done',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString(),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't2',
        title: 'Requirements workshop (2)',
        caseId: 'k3',
        status: 'doing',
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString(),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't3',
        title: 'Quote review',
        caseId: 'k4',
        status: 'todo',
        dueDate: null,
        assigneeUserId: 'u-manager',
      },
      {
        id: 't4',
        title: 'Internal memo',
        caseId: null,
        status: 'todo',
        dueDate: null,
        assigneeUserId: null,
      },
    ],
  }
}

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(KEYS.users)
    if (!raw) {
      localStorage.setItem(KEYS.users, JSON.stringify(demoUsers))
      return [...demoUsers]
    }
    const parsed = JSON.parse(raw) as User[]
    return Array.isArray(parsed) ? parsed : [...demoUsers]
  } catch {
    return [...demoUsers]
  }
}

export function saveUsers(users: User[]) {
  localStorage.setItem(KEYS.users, JSON.stringify(users))
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(KEYS.data)
    if (!raw) {
      const initial = seedData()
      localStorage.setItem(KEYS.data, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw) as AppData
  } catch {
    const initial = seedData()
    localStorage.setItem(KEYS.data, JSON.stringify(initial))
    return initial
  }
}

export function saveAppData(data: AppData) {
  localStorage.setItem(KEYS.data, JSON.stringify(data))
}

export type Session = { userId: string }

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEYS.session)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  if (!session) localStorage.removeItem(KEYS.session)
  else localStorage.setItem(KEYS.session, JSON.stringify(session))
}

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEYS.notifications)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AppNotification[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveNotifications(items: AppNotification[]) {
  localStorage.setItem(KEYS.notifications, JSON.stringify(items))
}
