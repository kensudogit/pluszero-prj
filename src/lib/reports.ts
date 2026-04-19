import type { CaseRecord, TaskRecord } from '../types'

export type ReportFilters = {
  periodFrom: string | null
  periodTo: string | null
  customerId: string | 'all'
  caseStatus: CaseRecord['status'] | 'all'
}

export function defaultFilters(): ReportFilters {
  return {
    periodFrom: null,
    periodTo: null,
    customerId: 'all',
    caseStatus: 'all',
  }
}

export function filterCases(cases: CaseRecord[], f: ReportFilters): CaseRecord[] {
  return cases.filter((c) => {
    if (f.customerId !== 'all' && c.customerId !== f.customerId) return false
    if (f.caseStatus !== 'all' && c.status !== f.caseStatus) return false
    if (f.periodFrom && c.period < f.periodFrom) return false
    if (f.periodTo && c.period > f.periodTo) return false
    return true
  })
}

export function tasksForFilteredCases(tasks: TaskRecord[], caseIds: Set<string>): TaskRecord[] {
  return tasks.filter((t) => !t.caseId || caseIds.has(t.caseId))
}

export type MonthlyRow = {
  period: string
  revenue: number
  cost: number
  profit: number
  caseCount: number
}

export function aggregateByMonth(cases: CaseRecord[]): MonthlyRow[] {
  const map = new Map<string, { revenue: number; cost: number; n: number }>()
  for (const c of cases) {
    const cur = map.get(c.period) ?? { revenue: 0, cost: 0, n: 0 }
    cur.revenue += c.revenue
    cur.cost += c.cost
    cur.n += 1
    map.set(c.period, cur)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      revenue: v.revenue,
      cost: v.cost,
      profit: v.revenue - v.cost,
      caseCount: v.n,
    }))
}

function mean(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0
  const m = mean(nums)
  const v = mean(nums.map((x) => (x - m) ** 2))
  return Math.sqrt(v)
}

export type AnomalyRow = {
  case: CaseRecord
  reasonKey: 'highRevenue' | 'lowMargin' | 'highCost'
}

/**
 * Simple heuristics: statistical outlier revenue, extreme negative margin, cost spike.
 */
export function detectAnomalies(cases: CaseRecord[], minSamples = 3): AnomalyRow[] {
  if (cases.length < minSamples) return []
  const revenues = cases.map((c) => c.revenue)
  const costs = cases.map((c) => c.cost)
  const mR = mean(revenues)
  const sdR = stdev(revenues)
  const mC = mean(costs)
  const sdC = stdev(costs)

  const out: AnomalyRow[] = []
  const seen = new Set<string>()

  for (const c of cases) {
    if (c.revenue <= 0) continue
    const margin = (c.revenue - c.cost) / c.revenue

    if (sdR > 0 && c.revenue > mR + 2.5 * sdR) {
      const id = `${c.id}-highRevenue`
      if (!seen.has(id)) {
        seen.add(id)
        out.push({ case: c, reasonKey: 'highRevenue' })
      }
      continue
    }

    if (margin < -0.5 && c.revenue >= 50000) {
      const id = `${c.id}-lowMargin`
      if (!seen.has(id)) {
        seen.add(id)
        out.push({ case: c, reasonKey: 'lowMargin' })
      }
      continue
    }

    if (sdC > 0 && c.cost > mC + 2.5 * sdC && c.cost > mC) {
      const id = `${c.id}-highCost`
      if (!seen.has(id)) {
        seen.add(id)
        out.push({ case: c, reasonKey: 'highCost' })
      }
    }
  }

  return out.slice(0, 50)
}

export type TaskStatusCounts = { todo: number; doing: number; done: number }

export function countTaskStatuses(tasks: TaskRecord[]): TaskStatusCounts {
  let todo = 0,
    doing = 0,
    done = 0
  for (const t of tasks) {
    if (t.status === 'todo') todo++
    else if (t.status === 'doing') doing++
    else done++
  }
  return { todo, doing, done }
}

export type CaseStatusCounts = Record<CaseRecord['status'], number>

export function countCaseStatuses(cases: CaseRecord[]): CaseStatusCounts {
  const d = { draft: 0, active: 0, closed: 0 }
  for (const c of cases) {
    d[c.status]++
  }
  return d
}
