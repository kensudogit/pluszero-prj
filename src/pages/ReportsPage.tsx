import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/DataContext'
import { downloadBlob, toCsv } from '../lib/csv'
import { yen } from '../lib/format'
import { canExportCsv, canViewFinanceDetail, canViewRevenueOnly } from '../lib/permissions'
import {
  aggregateByMonth,
  countCaseStatuses,
  countTaskStatuses,
  defaultFilters,
  detectAnomalies,
  filterCases,
  tasksForFilteredCases,
  type ReportFilters,
} from '../lib/reports'
import { ja } from '../locales'

const STATUS_COLORS = {
  draft: '#64748b',
  active: '#3b82f6',
  closed: '#059669',
}

export function ReportsPage() {
  const j = ja.reports
  const jc = ja.cases
  const { user } = useAuth()
  const {
    data: { cases: allCases, tasks: allTasks, customers },
  } = useAppData()

  const role = user!.role
  const showFinance = canViewFinanceDetail(role)
  const revenueOnly = canViewRevenueOnly(role)
  const showMoney = showFinance || revenueOnly
  const showExport = canExportCsv(role)

  const [filters, setFilters] = useState<ReportFilters>(() => defaultFilters())

  const filteredCases = useMemo(() => filterCases(allCases, filters), [allCases, filters])

  const caseIdSet = useMemo(() => new Set(filteredCases.map((c) => c.id)), [filteredCases])
  const scopedTasks = useMemo(() => tasksForFilteredCases(allTasks, caseIdSet), [allTasks, caseIdSet])

  const monthlyRows = useMemo(() => aggregateByMonth(filteredCases), [filteredCases])

  const chartMonthly = useMemo(
    () =>
      monthlyRows.map((r) => ({
        period: r.period,
        revenue: r.revenue,
        cost: r.cost,
        profit: r.profit,
      })),
    [monthlyRows]
  )

  const kpis = useMemo(() => {
    let revenue = 0
    let cost = 0
    for (const c of filteredCases) {
      revenue += c.revenue
      cost += c.cost
    }
    const profit = revenue - cost
    const n = filteredCases.length
    const avg = n > 0 ? Math.round(revenue / n) : 0
    const tc = countTaskStatuses(scopedTasks)
    const totalT = tc.todo + tc.doing + tc.done
    const doneRate = totalT > 0 ? Math.round((tc.done / totalT) * 1000) / 10 : 0
    return { revenue, cost, profit, n, avg, doneRate, tc }
  }, [filteredCases, scopedTasks])

  const statusPie = useMemo(() => {
    const c = countCaseStatuses(filteredCases)
    return [
      { name: jc.statusDraft, key: 'draft' as const, value: c.draft },
      { name: jc.statusActive, key: 'active' as const, value: c.active },
      { name: jc.statusClosed, key: 'closed' as const, value: c.closed },
    ].filter((x) => x.value > 0)
  }, [filteredCases, jc.statusActive, jc.statusClosed, jc.statusDraft])

  const taskStack = useMemo(
    () => [{ name: j.chartTasks, todo: kpis.tc.todo, doing: kpis.tc.doing, done: kpis.tc.done }],
    [j.chartTasks, kpis.tc]
  )

  const anomalies = useMemo(() => detectAnomalies(filteredCases), [filteredCases])

  const customersById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers])

  function clearFilters() {
    setFilters(defaultFilters())
  }

  function exportMonthlyCsv() {
    let headers: string[]
    let rows: string[][]
    if (showFinance) {
      headers = [j.colMonth, j.colRevenue, j.colCost, j.colProfit, j.colCases]
      rows = monthlyRows.map((r) => [
        r.period,
        String(r.revenue),
        String(r.cost),
        String(r.profit),
        String(r.caseCount),
      ])
    } else if (revenueOnly) {
      headers = [j.colMonth, j.colRevenue, j.colCases]
      rows = monthlyRows.map((r) => [r.period, String(r.revenue), String(r.caseCount)])
    } else {
      headers = [j.colMonth, j.colCases]
      rows = monthlyRows.map((r) => [r.period, String(r.caseCount)])
    }
    downloadBlob(`reports_monthly_${Date.now()}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
  }

  function exportCasesCsv() {
    const headers = showFinance
      ? [jc.colTitle, jc.colCustomer, jc.colStatus, jc.colRevenue, jc.colCost, jc.colProfit, jc.colPeriod]
      : revenueOnly
        ? [jc.colTitle, jc.colCustomer, jc.colStatus, jc.colRevenue, jc.colPeriod]
        : [jc.colTitle, jc.colCustomer, jc.colStatus, jc.colPeriod]
    const rows = filteredCases.map((c) => {
      const company = customersById.get(c.customerId)?.company ?? ''
      const statusLabel =
        c.status === 'draft' ? jc.statusDraft : c.status === 'active' ? jc.statusActive : jc.statusClosed
      const base = [c.title, company, statusLabel]
      if (showFinance) {
        return [
          ...base,
          String(c.revenue),
          String(c.cost),
          String(c.revenue - c.cost),
          c.period,
        ]
      }
      if (revenueOnly) {
        return [...base, String(c.revenue), c.period]
      }
      return [...base, c.period]
    })
    downloadBlob(`reports_cases_${Date.now()}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
  }

  function printPdf() {
    window.print()
  }

  const reasonText = (k: 'highRevenue' | 'lowMargin' | 'highCost') => {
    if (k === 'highRevenue') return j.reasonHighRevenue
    if (k === 'lowMargin') return j.reasonLowMargin
    return j.reasonHighCost
  }

  return (
    <div className="page reports-page">
      <header className="page-header row">
        <div>
          <h1>{j.title}</h1>
          <p className="page-desc">{j.desc}</p>
        </div>
        <div className="toolbar no-print">
          <button type="button" className="btn secondary" onClick={printPdf}>
            {j.printPdf}
          </button>
          <p className="reports-print-hint">{j.printHint}</p>
        </div>
      </header>

      <section className="card reports-filters no-print">
        <h2 className="reports-section-title">{j.filterTitle}</h2>
        <div className="reports-filter-grid">
          <label className="field">
            <span>{j.periodFrom}</span>
            <input
              type="month"
              value={filters.periodFrom ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, periodFrom: e.target.value || null }))
              }
            />
          </label>
          <label className="field">
            <span>{j.periodTo}</span>
            <input
              type="month"
              value={filters.periodTo ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, periodTo: e.target.value || null }))
              }
            />
          </label>
          <label className="field">
            <span>{j.customer}</span>
            <select
              value={filters.customerId === 'all' ? 'all' : filters.customerId}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  customerId: e.target.value === 'all' ? 'all' : e.target.value,
                }))
              }
            >
              <option value="all">{j.statusAll}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{j.status}</span>
            <select
              value={filters.caseStatus}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  caseStatus:
                    e.target.value === 'all'
                      ? 'all'
                      : (e.target.value as ReportFilters['caseStatus']),
                }))
              }
            >
              <option value="all">{j.statusAll}</option>
              <option value="draft">{jc.statusDraft}</option>
              <option value="active">{jc.statusActive}</option>
              <option value="closed">{jc.statusClosed}</option>
            </select>
          </label>
          <div className="reports-filter-actions">
            <button type="button" className="btn ghost" onClick={clearFilters}>
              {j.clearFilters}
            </button>
          </div>
        </div>
      </section>

      <div id="reports-print-root" className="reports-print-root">
        <section className="reports-kpi-grid">
          {showMoney ? (
            <>
              <div className="reports-kpi-card">
                <span className="reports-kpi-label">{j.kpiRevenue}</span>
                <span className="reports-kpi-value">{yen.format(kpis.revenue)}</span>
              </div>
              <div className="reports-kpi-card">
                <span className="reports-kpi-label">{j.kpiAvgDeal}</span>
                <span className="reports-kpi-value">{yen.format(kpis.avg)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="reports-kpi-card reports-kpi-muted">
                <span className="reports-kpi-label">{j.kpiRevenue}</span>
                <span className="reports-kpi-value">{ja.common.viewOnly}</span>
              </div>
              <div className="reports-kpi-card reports-kpi-muted">
                <span className="reports-kpi-label">{j.kpiAvgDeal}</span>
                <span className="reports-kpi-value">{ja.common.viewOnly}</span>
              </div>
            </>
          )}
          <div className="reports-kpi-card">
            <span className="reports-kpi-label">{j.kpiCases}</span>
            <span className="reports-kpi-value">{kpis.n}</span>
          </div>
          {showFinance ? (
            <div className="reports-kpi-card">
              <span className="reports-kpi-label">{j.kpiProfit}</span>
              <span className="reports-kpi-value">{yen.format(kpis.profit)}</span>
            </div>
          ) : (
            <div className="reports-kpi-card reports-kpi-muted">
              <span className="reports-kpi-label">{j.kpiProfit}</span>
              <span className="reports-kpi-value">{ja.common.viewOnly}</span>
            </div>
          )}
          <div className="reports-kpi-card">
            <span className="reports-kpi-label">{j.kpiTaskDone}</span>
            <span className="reports-kpi-value">{kpis.doneRate}%</span>
          </div>
        </section>

        {showMoney && monthlyRows.length > 0 ? (
          <section className="card reports-chart-block">
            <h2 className="reports-section-title">{j.chartMonthly}</h2>
            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartMonthly}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 10000)}`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      yen.format(Number(value ?? 0)),
                      typeof name === 'string' ? name : String(name ?? ''),
                    ]}
                    labelFormatter={(l) => String(l)}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name={j.seriesRevenue} fill="#6c9cff" />
                  {showFinance ? (
                    <>
                      <Bar dataKey="cost" name={j.seriesCost} fill="#f97316" />
                      <Bar dataKey="profit" name={j.seriesProfit} fill="#34d399" />
                    </>
                  ) : null}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        ) : null}

        {!showMoney && monthlyRows.length > 0 ? (
          <section className="card reports-chart-block">
            <h2 className="reports-section-title">{j.chartMonthly}</h2>
            <p className="reports-muted">{j.financeHidden}</p>
          </section>
        ) : null}

        <div className="reports-two-col">
          <section className="card reports-chart-block">
            <h2 className="reports-section-title">{j.chartCaseStatus}</h2>
            {statusPie.length === 0 ? (
              <p className="reports-muted">{ja.pagination.empty}</p>
            ) : (
              <div className="reports-chart-wrap reports-chart-wrap--pie">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
                      {statusPie.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value ?? 0)} ${j.colCases}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="card reports-chart-block">
            <h2 className="reports-section-title">{j.chartTasks}</h2>
            <div className="reports-chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={taskStack}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="todo" stackId="t" name={j.taskTodo} fill="#94a3b8" />
                  <Bar dataKey="doing" stackId="t" name={j.taskDoing} fill="#3b82f6" />
                  <Bar dataKey="done" stackId="t" name={j.taskDone} fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="card">
          <h2 className="reports-section-title">{j.sectionMonthly}</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{j.colMonth}</th>
                  {showFinance ? (
                    <>
                      <th>{j.colRevenue}</th>
                      <th>{j.colCost}</th>
                      <th>{j.colProfit}</th>
                    </>
                  ) : null}
                  {revenueOnly && !showFinance ? <th>{j.colRevenue}</th> : null}
                  <th>{j.colCases}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((r) => (
                  <tr key={r.period}>
                    <td>{r.period}</td>
                    {showFinance ? (
                      <>
                        <td>{yen.format(r.revenue)}</td>
                        <td>{yen.format(r.cost)}</td>
                        <td>{yen.format(r.profit)}</td>
                      </>
                    ) : null}
                    {revenueOnly && !showFinance ? <td>{yen.format(r.revenue)}</td> : null}
                    <td>{r.caseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {monthlyRows.length === 0 ? <p className="reports-muted">{ja.pagination.empty}</p> : null}
        </section>

        <section className="card">
          <h2 className="reports-section-title">{j.sectionAnomaly}</h2>
          {anomalies.length === 0 ? (
            <p className="reports-muted">{j.anomalyNone}</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{j.colCaseTitle}</th>
                    <th>{j.colCustomer}</th>
                    <th>{j.colReason}</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map(({ case: row, reasonKey }) => (
                    <tr key={row.id}>
                      <td>
                        <Link to={`/cases#${row.id}`}>{row.title}</Link>
                      </td>
                      <td>{customersById.get(row.customerId)?.company ?? ja.common.dash}</td>
                      <td>{reasonText(reasonKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showExport ? (
        <section className="card reports-export no-print">
          <h2 className="reports-section-title">CSV / Excel</h2>
          <p className="reports-muted">{j.exportHint}</p>
          <div className="toolbar">
            <button type="button" className="btn secondary" onClick={exportMonthlyCsv}>
              {j.exportMonthly}
            </button>
            <button type="button" className="btn secondary" onClick={exportCasesCsv}>
              {j.exportCases}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
