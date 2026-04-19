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
  const y = now.getFullYear()
  const mo = now.getMonth()
  const d = now.getDate()

  const ym = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`

  /** Rolling months for KPI / period labels */
  const monthBack = (n: number) => new Date(y, mo - n, Math.min(d, 28))

  const m0 = monthBack(5)
  const m1 = monthBack(4)
  const m2 = monthBack(3)
  const m3 = monthBack(2)
  const m4 = monthBack(1)
  const m5 = new Date(y, mo, Math.min(d, 28))

  const due = (daysFromToday: number) =>
    new Date(y, mo, d + daysFromToday).toISOString()

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
      {
        id: 'c4',
        name: 'Yuki Nakamura',
        company: 'Harbor Logistics KK',
        email: 'nakamura@harbor-logistics.example',
        phone: '045-200-8800',
        note: 'WMS renewal interest',
      },
      {
        id: 'c5',
        name: 'Kenji Fujita',
        company: 'Metro Finance Securities',
        email: 'fujita@metro-finance.example',
        phone: '03-6789-1200',
        note: 'Compliance review required',
      },
      {
        id: 'c6',
        name: 'Naomi Ozaki',
        company: 'Northwind Retail Co.',
        email: 'ozaki@northwind-retail.example',
        phone: '011-755-3010',
        note: 'Multi-store rollout',
      },
      {
        id: 'c7',
        name: 'Riku Hayashi',
        company: 'Pacific BioMed Labs',
        email: 'hayashi@pacific-biomed.example',
        phone: '078-321-4400',
        note: 'ISO audit window Q4',
      },
      {
        id: 'c8',
        name: 'Emi Takada',
        company: 'Urban Smart Living',
        email: 'takada@urban-smart.example',
        phone: '052-910-2244',
        note: 'IoT platform pilot',
      },
      {
        id: 'c9',
        name: 'Shota Kondo',
        company: 'East Edge Manufacturing',
        email: 'kondo@east-edge.example',
        phone: '029-440-7711',
        note: 'MES integration',
      },
      {
        id: 'c10',
        name: 'Mika Hirano',
        company: 'Sunrise EduTech',
        email: 'hirano@sunrise-edutech.example',
        phone: '082-555-0199',
        note: 'SaaS expansion',
      },
      {
        id: 'c11',
        name: 'Daiki Mori',
        company: 'GreenLeaf Foods',
        email: 'mori@greenleaf-foods.example',
        phone: '076-432-8800',
        note: 'Traceability project',
      },
      {
        id: 'c12',
        name: 'Ayaka Shimizu',
        company: 'SkyBridge Telecom',
        email: 'shimizu@skybridge-tel.example',
        phone: '03-5298-6600',
        note: '5G edge PoC',
      },
      {
        id: 'c13',
        name: 'Hiro Tanaka',
        company: 'Coastal Resort Group',
        email: 'tanaka@coastal-resort.example',
        phone: '098-876-2100',
        note: 'CRM + loyalty',
      },
      {
        id: 'c14',
        name: 'Reina Komatsu',
        company: 'Atlas Insurance Partners',
        email: 'komatsu@atlas-ins.example',
        phone: '06-6123-4500',
        note: 'Legacy core assessment',
      },
      {
        id: 'c15',
        name: 'Sora Watanabe',
        company: 'Velocity Motors',
        email: 'watanabe@velocity-motors.example',
        phone: '0568-90-4400',
        note: 'Dealer network portal',
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
        period: ym(m3),
        updatedAt: m3.toISOString(),
      },
      {
        id: 'k2',
        title: 'Process improvement',
        customerId: 'c2',
        status: 'closed',
        revenue: 3_200_000,
        cost: 1_800_000,
        period: ym(m4),
        updatedAt: m4.toISOString(),
      },
      {
        id: 'k3',
        title: 'Cloud migration support',
        customerId: 'c1',
        status: 'active',
        revenue: 4_500_000,
        cost: 2_900_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k4',
        title: 'Data platform PoC',
        customerId: 'c3',
        status: 'draft',
        revenue: 0,
        cost: 400_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k5',
        title: 'Warehouse management renewal',
        customerId: 'c4',
        status: 'active',
        revenue: 12_000_000,
        cost: 7_100_000,
        period: ym(m4),
        updatedAt: m4.toISOString(),
      },
      {
        id: 'k6',
        title: 'Trading risk dashboard',
        customerId: 'c5',
        status: 'active',
        revenue: 6_800_000,
        cost: 3_900_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k7',
        title: 'POS integration phase 2',
        customerId: 'c6',
        status: 'closed',
        revenue: 5_400_000,
        cost: 2_700_000,
        period: ym(m2),
        updatedAt: m2.toISOString(),
      },
      {
        id: 'k8',
        title: 'LIMS interface upgrade',
        customerId: 'c7',
        status: 'active',
        revenue: 9_200_000,
        cost: 5_600_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k9',
        title: 'Smart building analytics',
        customerId: 'c8',
        status: 'draft',
        revenue: 0,
        cost: 650_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k10',
        title: 'Production line data collection',
        customerId: 'c9',
        status: 'active',
        revenue: 11_500_000,
        cost: 6_800_000,
        period: ym(m4),
        updatedAt: m4.toISOString(),
      },
      {
        id: 'k11',
        title: 'Learning platform SSO',
        customerId: 'c10',
        status: 'closed',
        revenue: 2_800_000,
        cost: 1_400_000,
        period: ym(m1),
        updatedAt: m1.toISOString(),
      },
      {
        id: 'k12',
        title: 'Cold chain monitoring',
        customerId: 'c11',
        status: 'active',
        revenue: 7_300_000,
        cost: 4_200_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k13',
        title: 'Network operations cockpit',
        customerId: 'c12',
        status: 'draft',
        revenue: 0,
        cost: 550_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k14',
        title: 'Guest loyalty program',
        customerId: 'c13',
        status: 'active',
        revenue: 4_100_000,
        cost: 2_200_000,
        period: ym(m4),
        updatedAt: m4.toISOString(),
      },
      {
        id: 'k15',
        title: 'Policy admin modernization',
        customerId: 'c14',
        status: 'active',
        revenue: 18_000_000,
        cost: 10_500_000,
        period: ym(m3),
        updatedAt: m3.toISOString(),
      },
      {
        id: 'k16',
        title: 'Dealer portal MVP',
        customerId: 'c15',
        status: 'closed',
        revenue: 6_000_000,
        cost: 3_300_000,
        period: ym(m2),
        updatedAt: m2.toISOString(),
      },
      {
        id: 'k17',
        title: 'HR payroll bridge',
        customerId: 'c2',
        status: 'draft',
        revenue: 0,
        cost: 320_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k18',
        title: 'Customer data lake design',
        customerId: 'c5',
        status: 'closed',
        revenue: 4_800_000,
        cost: 2_600_000,
        period: ym(m0),
        updatedAt: m0.toISOString(),
      },
      {
        id: 'k19',
        title: 'Mobile field service app',
        customerId: 'c9',
        status: 'active',
        revenue: 5_900_000,
        cost: 3_400_000,
        period: ym(m5),
        updatedAt: m5.toISOString(),
      },
      {
        id: 'k20',
        title: 'Annual support retainer FY',
        customerId: 'c1',
        status: 'active',
        revenue: 3_600_000,
        cost: 1_100_000,
        period: ym(m4),
        updatedAt: m4.toISOString(),
      },
    ],
    tasks: [
      {
        id: 't1',
        title: 'Kickoff deck',
        caseId: 'k1',
        status: 'done',
        dueDate: due(-5),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't2',
        title: 'Requirements workshop (2)',
        caseId: 'k3',
        status: 'doing',
        dueDate: due(3),
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
      {
        id: 't5',
        title: 'Site survey @ warehouse',
        caseId: 'k5',
        status: 'doing',
        dueDate: due(2),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't6',
        title: 'Integration test plan',
        caseId: 'k5',
        status: 'todo',
        dueDate: due(10),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't7',
        title: 'Risk KPI mock review',
        caseId: 'k6',
        status: 'done',
        dueDate: due(-2),
        assigneeUserId: 'u-manager',
      },
      {
        id: 't8',
        title: 'Vendor security questionnaire',
        caseId: 'k6',
        status: 'doing',
        dueDate: due(7),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't9',
        title: 'UAT sign-off',
        caseId: 'k7',
        status: 'done',
        dueDate: due(-14),
        assigneeUserId: 'u-admin',
      },
      {
        id: 't10',
        title: 'HL7 mapping workshop',
        caseId: 'k8',
        status: 'doing',
        dueDate: due(5),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't11',
        title: 'Equipment list finalization',
        caseId: 'k8',
        status: 'todo',
        dueDate: due(12),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't12',
        title: 'PoC scope document',
        caseId: 'k9',
        status: 'todo',
        dueDate: due(4),
        assigneeUserId: 'u-manager',
      },
      {
        id: 't13',
        title: 'PLC gateway PoC setup',
        caseId: 'k10',
        status: 'doing',
        dueDate: due(1),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't14',
        title: 'Executive steering deck',
        caseId: 'k10',
        status: 'todo',
        dueDate: due(8),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't15',
        title: 'SAML IdP configuration',
        caseId: 'k11',
        status: 'done',
        dueDate: due(-30),
        assigneeUserId: 'u-admin',
      },
      {
        id: 't16',
        title: 'Sensor calibration visit',
        caseId: 'k12',
        status: 'doing',
        dueDate: due(6),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't17',
        title: 'Alert rules draft',
        caseId: 'k13',
        status: 'todo',
        dueDate: null,
        assigneeUserId: 'u-staff',
      },
      {
        id: 't18',
        title: 'Loyalty tier rules workshop',
        caseId: 'k14',
        status: 'doing',
        dueDate: due(9),
        assigneeUserId: 'u-manager',
      },
      {
        id: 't19',
        title: 'Legacy policy API inventory',
        caseId: 'k15',
        status: 'doing',
        dueDate: due(4),
        assigneeUserId: 'u-admin',
      },
      {
        id: 't20',
        title: 'UX review with business owners',
        caseId: 'k15',
        status: 'todo',
        dueDate: due(11),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't21',
        title: 'Dealer training materials',
        caseId: 'k16',
        status: 'done',
        dueDate: due(-7),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't22',
        title: 'Payroll vendor kickoff',
        caseId: 'k17',
        status: 'todo',
        dueDate: due(14),
        assigneeUserId: 'u-manager',
      },
      {
        id: 't23',
        title: 'Data catalog handover',
        caseId: 'k18',
        status: 'done',
        dueDate: due(-45),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't24',
        title: 'Offline sync spike',
        caseId: 'k19',
        status: 'doing',
        dueDate: due(2),
        assigneeUserId: 'u-staff',
      },
      {
        id: 't25',
        title: 'Quarterly steering',
        caseId: 'k20',
        status: 'todo',
        dueDate: due(15),
        assigneeUserId: 'u-sales',
      },
      {
        id: 't26',
        title: 'Demo dry-run for investors',
        caseId: null,
        status: 'doing',
        dueDate: due(3),
        assigneeUserId: 'u-manager',
      },
      {
        id: 't27',
        title: 'Press release review',
        caseId: null,
        status: 'todo',
        dueDate: due(20),
        assigneeUserId: 'u-admin',
      },
      {
        id: 't28',
        title: 'Partner NDA renewal',
        caseId: null,
        status: 'todo',
        dueDate: null,
        assigneeUserId: 'u-sales',
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
