export type Role = 'admin' | 'manager' | 'sales' | 'staff'

export type User = {
  id: string
  email: string
  name: string
  role: Role
  /** Demo only — do not persist plain passwords in production */
  password: string
}

export type CaseRecord = {
  id: string
  title: string
  customerId: string
  status: 'draft' | 'active' | 'closed'
  revenue: number
  cost: number
  /** Recognition month YYYY-MM */
  period: string
  updatedAt: string
}

export type TaskRecord = {
  id: string
  title: string
  caseId: string | null
  status: 'todo' | 'doing' | 'done'
  dueDate: string | null
  assigneeUserId: string | null
}

export type CustomerRecord = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  note: string
}

export type AppNotification = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type AppData = {
  cases: CaseRecord[]
  tasks: TaskRecord[]
  customers: CustomerRecord[]
}
