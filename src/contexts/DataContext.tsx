import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, CaseRecord, CustomerRecord, TaskRecord } from '../types'
import { loadAppData, saveAppData } from '../storage/appStorage'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

type DataContextValue = {
  data: AppData
  upsertCase: (row: CaseRecord) => void
  removeCase: (id: string) => void
  upsertTask: (row: TaskRecord) => void
  removeTask: (id: string) => void
  upsertCustomer: (row: CustomerRecord) => void
  removeCustomer: (id: string) => void
  replaceAll: (next: AppData) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData())

  const persist = useCallback((next: AppData) => {
    saveAppData(next)
    setData(next)
  }, [])

  const upsertCase = useCallback(
    (row: CaseRecord) => {
      const others = data.cases.filter((c) => c.id !== row.id)
      persist({ ...data, cases: [...others, row] })
    },
    [data, persist]
  )

  const removeCase = useCallback(
    (id: string) => {
      persist({
        ...data,
        cases: data.cases.filter((c) => c.id !== id),
        tasks: data.tasks.map((t) => (t.caseId === id ? { ...t, caseId: null } : t)),
      })
    },
    [data, persist]
  )

  const upsertTask = useCallback(
    (row: TaskRecord) => {
      const others = data.tasks.filter((t) => t.id !== row.id)
      persist({ ...data, tasks: [...others, row] })
    },
    [data, persist]
  )

  const removeTask = useCallback(
    (id: string) => {
      persist({ ...data, tasks: data.tasks.filter((t) => t.id !== id) })
    },
    [data, persist]
  )

  const upsertCustomer = useCallback(
    (row: CustomerRecord) => {
      const others = data.customers.filter((c) => c.id !== row.id)
      persist({ ...data, customers: [...others, row] })
    },
    [data, persist]
  )

  const removeCustomer = useCallback(
    (id: string) => {
      persist({
        ...data,
        customers: data.customers.filter((c) => c.id !== id),
        cases: data.cases.filter((k) => k.customerId !== id),
      })
    },
    [data, persist]
  )

  const replaceAll = useCallback(
    (next: AppData) => {
      persist(next)
    },
    [persist]
  )

  const value = useMemo(
    () => ({
      data,
      upsertCase,
      removeCase,
      upsertTask,
      removeTask,
      upsertCustomer,
      removeCustomer,
      replaceAll,
    }),
    [
      data,
      upsertCase,
      removeCase,
      upsertTask,
      removeTask,
      upsertCustomer,
      removeCustomer,
      replaceAll,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAppData must be used within DataProvider')
  return ctx
}

export { uid }
