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
import { canViewFinanceDetail, canViewRevenueOnly } from '../lib/permissions'

export function DashboardPage() {
  const { user } = useAuth()
  const {
    data: { cases, tasks },
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

  const showFinance = canViewFinanceDetail(role) || canViewRevenueOnly(role)
  const detail = canViewFinanceDetail(role)
  const revenueOnly = canViewRevenueOnly(role)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-desc">Overview of pipeline, tasks, and financials.</p>
      </header>

      <section className="card-grid">
        <div className="card kpi">
          <div className="kpi-label">Cases</div>
          <div className="kpi-value">{cases.length}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Tasks (todo / doing / done)</div>
          <div className="kpi-value compact">
            {taskStats.todo} / {taskStats.doing} / {taskStats.done}
          </div>
        </div>
        {detail ? (
          <>
            <div className="card kpi">
              <div className="kpi-label">Revenue (total)</div>
              <div className="kpi-value">{yen.format(totals.revenue)}</div>
            </div>
            <div className="card kpi">
              <div className="kpi-label">Cost / profit</div>
              <div className="kpi-sub">
                Cost {yen.format(totals.cost)} / Profit {yen.format(totals.profit)}
              </div>
            </div>
          </>
        ) : revenueOnly ? (
          <div className="card kpi wide">
            <div className="kpi-label">Revenue (total)</div>
            <div className="kpi-value">{yen.format(totals.revenue)}</div>
          </div>
        ) : (
          <div className="card muted wide">
            <p>Financial KPIs are hidden for your role.</p>
          </div>
        )}
      </section>

      {showFinance ? (
        <section className="card chart-card">
          <h2>{revenueOnly ? 'Revenue by month' : 'Revenue, cost & profit by month'}</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 10000)}w`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    yen.format(typeof value === 'number' ? value : Number(value)),
                    chartSeriesLabel(String(name)),
                  ]}
                  labelFormatter={(l) => `Month: ${l}`}
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
          <h2>Summary</h2>
          <p className="muted">Use Cases and Tasks to drive work. Charts are available to managers and above.</p>
        </section>
      )}
    </div>
  )
}

function chartSeriesLabel(name: string) {
  const map: Record<string, string> = {
    revenue: 'Revenue',
    cost: 'Cost',
    profit: 'Profit',
  }
  return map[name] ?? name
}
