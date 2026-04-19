import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/DataContext'
import { yen } from '../lib/format'
import {
  canManageAllTasks,
  canViewFinanceDetail,
  canViewRevenueOnly,
} from '../lib/permissions'
import { interpolate, ja } from '../locales'

export function DashboardPage() {
  const j = ja.dashboard
  const { user } = useAuth()
  const {
    data: { cases, tasks, customers },
  } = useAppData()
  const role = user!.role

  const chartRows = useMemo(() => {
    const map = new Map<string, { revenue: number; cost: number }>()
    for (const c of cases) {
      const cur = map.get(c.period) ?? { revenue: 0, cost: 0 }
      cur.revenue += c.revenue
      cur.cost += c.cost
      map.set(c.period, cur)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({
        period,
        revenue: v.revenue,
        cost: v.cost,
        profit: v.revenue - v.cost,
      }))
  }, [cases])

  const totals = useMemo(() => {
    let revenue = 0
    let cost = 0
    for (const c of cases) {
      revenue += c.revenue
      cost += c.cost
    }
    return { revenue, cost, profit: revenue - cost }
  }, [cases])

  const taskStats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length
    const doing = tasks.filter((t) => t.status === 'doing').length
    const done = tasks.filter((t) => t.status === 'done').length
    return { todo, doing, done }
  }, [tasks])

  const topCustomers = useMemo(() => {
    const agg = new Map<string, { revenue: number; n: number }>()
    for (const c of cases) {
      const cur = agg.get(c.customerId) ?? { revenue: 0, n: 0 }
      cur.revenue += c.revenue
      cur.n += 1
      agg.set(c.customerId, cur)
    }
    const rows = [...agg.entries()].map(([id, v]) => ({
      id,
      company: customers.find((x) => x.id === id)?.company ?? id,
      revenue: v.revenue,
      n: v.n,
    }))
    const detail = canViewFinanceDetail(role)
    const revenueOnly = canViewRevenueOnly(role)
    if (detail || revenueOnly) {
      return [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    }
    return [...rows].sort((a, b) => b.n - a.n).slice(0, 5)
  }, [cases, customers, role])

  const overdueTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks
      .filter((t) => {
        if (t.status === 'done') return false
        if (!t.dueDate) return false
        const dd = new Date(t.dueDate)
        dd.setHours(0, 0, 0, 0)
        return dd.getTime() < today.getTime()
      })
      .sort((a, b) => {
        const ta = a.dueDate ? new Date(a.dueDate).getTime() : 0
        const tb = b.dueDate ? new Date(b.dueDate).getTime() : 0
        return ta - tb
      })
      .slice(0, 8)
  }, [tasks])

  const visibleOverdue = useMemo(() => {
    if (canManageAllTasks(role)) return overdueTasks
    return overdueTasks.filter(
      (t) => t.assigneeUserId === user!.id || t.assigneeUserId === null
    )
  }, [overdueTasks, role, user])

  const showFinance = canViewFinanceDetail(role) || canViewRevenueOnly(role)
  const detail = canViewFinanceDetail(role)
  const revenueOnly = canViewRevenueOnly(role)

  const costProfitLine = interpolate(j.kpiCostProfitDetail, {
    cost: yen.format(totals.cost),
    profit: yen.format(totals.profit),
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1>{j.title}</h1>
        <p className="page-desc">{j.desc}</p>
      </header>

      <section className="card-grid">
        <div className="card kpi">
          <div className="kpi-label">{j.kpiCases}</div>
          <div className="kpi-value">{cases.length}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">{j.kpiTasks}</div>
          <div className="kpi-value compact">
            {taskStats.todo} / {taskStats.doing} / {taskStats.done}
          </div>
        </div>
        {detail ? (
          <>
            <div className="card kpi">
              <div className="kpi-label">{j.kpiRevenue}</div>
              <div className="kpi-value">{yen.format(totals.revenue)}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">{j.kpiCostProfit}</div>
              <div className="kpi-sub">{costProfitLine}</div>
            </div>
          </>
        ) : revenueOnly ? (
          <div className="card kpi wide">
            <div className="kpi-label">{j.kpiRevenue}</div>
            <div className="kpi-value">{yen.format(totals.revenue)}</div>
          </div>
        ) : (
          <div className="card muted wide">
            <p>{j.kpiFinanceHidden}</p>
          </div>
        )}
      </section>

      {showFinance ? (
        <section className="card chart-card">
          <h2>{revenueOnly ? j.chartRevenueOnly : j.chartFull}</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(Number(v) / 10000)}${j.chartTickUnit}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    yen.format(typeof value === 'number' ? value : Number(value)),
                    chartSeriesLabel(String(name)),
                  ]}
                  labelFormatter={(l) => `${ja.common.monthLabel}${l}`}
                />
                <Legend formatter={(name) => chartSeriesLabel(String(name))} />
                <Bar dataKey="revenue" name="revenue" fill="var(--chart-revenue)" radius={[4, 4, 0, 0]} />
                {!revenueOnly ? (
                  <>
                    <Bar dataKey="cost" name="cost" fill="var(--chart-cost)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="profit" fill="var(--chart-profit)" radius={[4, 4, 0, 0]} />
                  </>
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>{j.summaryTitle}</h2>
          <p className="muted">{j.summaryDesc}</p>
        </section>
      )}

      <section className="dashboard-split">
        <div className="card">
          <h2>{detail || revenueOnly ? j.topByRevenue : j.topByCases}</h2>
          <div className="table-wrap compact-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{ja.customers.colCompany}</th>
                  {detail || revenueOnly ? <th>{j.colRevenueSum}</th> : null}
                  <th>{j.colCaseCount}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((row) => (
                  <tr key={row.id}>
                    <td>{row.company}</td>
                    {detail || revenueOnly ? <td>{yen.format(row.revenue)}</td> : null}
                    <td>{row.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>{j.overdueTitle}</h2>
          {visibleOverdue.length === 0 ? (
            <p className="muted">{j.overdueNone}</p>
          ) : (
            <div className="table-wrap compact-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{ja.tasks.colTitle}</th>
                    <th>{ja.tasks.colCase}</th>
                    <th>{j.overdueColDue}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOverdue.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>
                        {t.caseId
                          ? cases.find((k) => k.id === t.caseId)?.title ?? ja.common.dash
                          : ja.common.dash}
                      </td>
                      <td>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('ja-JP') : ja.common.dash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function chartSeriesLabel(name: string) {
  const j = ja.dashboard
  const map: Record<string, string> = {
    revenue: j.seriesRevenue,
    cost: j.seriesCost,
    profit: j.seriesProfit,
  }
  return map[name] ?? name
}
