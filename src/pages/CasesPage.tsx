import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uid, useAppData } from '../contexts/DataContext'
import { downloadBlob, parseCsv, toCsv } from '../lib/csv'
import { clampPage, PAGE_SIZE_OPTIONS, type PageSize } from '../lib/pagination'
import { yen } from '../lib/format'
import {
  canEditCases,
  canExportCsv,
  canImportCsv,
  canViewFinanceDetail,
  canViewRevenueOnly,
} from '../lib/permissions'
import { PaginationBar } from '../components/PaginationBar'
import { ja } from '../locales'
import type { CaseRecord } from '../types'

type SortKey = 'title' | 'customer' | 'status' | 'revenue' | 'profit' | 'period' | 'updatedAt'

function norm(s: string) {
  return s.trim().toLowerCase()
}

export function CasesPage() {
  const j = ja.cases
  const { user } = useAuth()
  const { data, upsertCase, removeCase } = useAppData()
  const role = user!.role
  const canEdit = canEditCases(role)
  const canCsvOut = canExportCsv(role)
  const canCsvIn = canImportCsv(role)
  const showCost = canViewFinanceDetail(role)
  const showRevOnly = canViewRevenueOnly(role)

  const location = useLocation()
  const customersById = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers])

  const [draft, setDraft] = useState<CaseRecord | null>(null)
  const [filterQ, setFilterQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | CaseRecord['status']>('all')
  const [filterCustomer, setFilterCustomer] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[1])

  useEffect(() => {
    setPage(1)
  }, [filterQ, filterStatus, filterCustomer])

  const filteredCases = useMemo(() => {
    let rows = data.cases
    if (filterStatus !== 'all') rows = rows.filter((c) => c.status === filterStatus)
    if (filterCustomer !== 'all') rows = rows.filter((c) => c.customerId === filterCustomer)
    const q = norm(filterQ)
    if (q) {
      rows = rows.filter((c) => {
        const cust = customersById.get(c.customerId)
        const blob = [c.title, c.period, c.status, cust?.company, cust?.name].filter(Boolean).join(' ')
        return norm(blob).includes(q)
      })
    }
    return rows
  }, [customersById, data.cases, filterCustomer, filterQ, filterStatus])

  const sortedCases = useMemo(() => {
    const rows = [...filteredCases]
    const mul = sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const ca = customersById.get(a.customerId)?.company ?? ''
      const cb = customersById.get(b.customerId)?.company ?? ''
      const pa = a.revenue - a.cost
      const pb = b.revenue - b.cost
      switch (sortKey) {
        case 'title':
          return mul * a.title.localeCompare(b.title, 'ja')
        case 'customer':
          return mul * ca.localeCompare(cb, 'ja')
        case 'status':
          return mul * a.status.localeCompare(b.status)
        case 'revenue':
          return mul * (a.revenue - b.revenue)
        case 'profit':
          return mul * (pa - pb)
        case 'period':
          return mul * a.period.localeCompare(b.period)
        case 'updatedAt':
          return mul * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        default:
          return 0
      }
    })
    return rows
  }, [customersById, filteredCases, sortDir, sortKey])

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(sortedCases.length / pageSize) || 1)
    setPage((p) => Math.min(p, tp))
  }, [sortedCases.length, pageSize])

  useEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    const idx = sortedCases.findIndex((c) => c.id === raw)
    if (idx >= 0) setPage(Math.floor(idx / pageSize) + 1)
  }, [location.hash, sortedCases, pageSize])

  const safePage = clampPage(page, sortedCases.length, pageSize)

  const pagedCases = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedCases.slice(start, start + pageSize)
  }, [sortedCases, safePage, pageSize])

  useEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    let tid = 0
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`case-row-${raw}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      el.classList.add('row-highlight')
      tid = window.setTimeout(() => el.classList.remove('row-highlight'), 2200)
    })
    return () => {
      cancelAnimationFrame(raf)
      if (tid) window.clearTimeout(tid)
    }
  }, [location.hash, safePage])

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir(key === 'title' || key === 'customer' || key === 'period' ? 'asc' : 'desc')
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    }
  }

  function sortMark(key: SortKey) {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' \u2191' : ' \u2193'
  }

  function startNew() {
    const now = new Date().toISOString()
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    setDraft({
      id: uid('case'),
      title: '',
      customerId: data.customers[0]?.id ?? '',
      status: 'draft',
      revenue: 0,
      cost: 0,
      period,
      updatedAt: now,
    })
  }

  function saveDraft() {
    if (!draft) return
    if (!draft.title.trim() || !draft.customerId) return
    upsertCase({ ...draft, updatedAt: new Date().toISOString() })
    setDraft(null)
  }

  function exportCsv() {
    const headers = ['id', 'title', 'customerId', 'status', 'revenue', 'cost', 'period', 'updatedAt']
    const rows = data.cases.map((c) =>
      headers.map((h) => String((c as Record<string, unknown>)[h] ?? ''))
    )
    downloadBlob(`cases_${Date.now()}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
  }

  const tableColSpan = 6 + (showCost || showRevOnly ? 1 : 0) + (showCost ? 2 : 0)

  function importCsv(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const { rows } = parseCsv(text)
      for (const r of rows) {
        const id = r.id?.trim()
        if (!id) continue
        upsertCase({
          id,
          title: r.title ?? '',
          customerId: r.customerId ?? '',
          status: (r.status as CaseRecord['status']) || 'draft',
          revenue: Number(r.revenue) || 0,
          cost: Number(r.cost) || 0,
          period: r.period || `${new Date().getFullYear()}-01`,
          updatedAt: r.updatedAt || new Date().toISOString(),
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1>{j.title}</h1>
          <p className="page-desc">{j.desc}</p>
        </div>
        <div className="toolbar">
          {canCsvOut ? (
            <button type="button" className="btn secondary" onClick={exportCsv}>
              {ja.common.exportCsv}
            </button>
          ) : null}
          {canCsvIn ? (
            <label className="btn secondary file-btn">
              {ja.common.importCsv}
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importCsv(f)
                  e.target.value = ''
                }}
              />
            </label>
          ) : null}
          {canEdit ? (
            <button type="button" className="btn primary" onClick={startNew}>
              {j.newCase}
            </button>
          ) : null}
        </div>
      </header>

      <p className="filter-hint muted">{j.sortHint}</p>

      <div className="filter-bar card">
        <label className="field compact">
          <span>{j.filterKeyword}</span>
          <input
            type="search"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="field compact">
          <span>{j.filterStatus}</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="all">{j.filterStatusAll}</option>
            <option value="draft">{j.statusDraft}</option>
            <option value="active">{j.statusActive}</option>
            <option value="closed">{j.statusClosed}</option>
          </select>
        </label>
        <label className="field compact">
          <span>{j.filterCustomer}</span>
          <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
            <option value="all">{j.filterCustomerAll}</option>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort('title')}>
                  {j.colTitle}
                  {sortMark('title')}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort('customer')}>
                  {j.colCustomer}
                  {sortMark('customer')}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort('status')}>
                  {j.colStatus}
                  {sortMark('status')}
                </button>
              </th>
              {showCost || showRevOnly ? (
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('revenue')}>
                    {j.colRevenue}
                    {sortMark('revenue')}
                  </button>
                </th>
              ) : null}
              {showCost ? (
                <>
                  <th>{j.colCost}</th>
                  <th>
                    <button type="button" className="th-sort" onClick={() => toggleSort('profit')}>
                      {j.colProfit}
                      {sortMark('profit')}
                    </button>
                  </th>
                </>
              ) : null}
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort('period')}>
                  {j.colPeriod}
                  {sortMark('period')}
                </button>
              </th>
              <th>
                <button type="button" className="th-sort" onClick={() => toggleSort('updatedAt')}>
                  {j.colUpdated}
                  {sortMark('updatedAt')}
                </button>
              </th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={tableColSpan} className="muted">
                  {j.filterEmpty}
                </td>
              </tr>
            ) : (
              pagedCases.map((c) => {
                const cust = customersById.get(c.customerId)
                const profit = c.revenue - c.cost
                return (
                  <tr key={c.id} id={`case-row-${c.id}`}>
                    <td>{c.title}</td>
                    <td>{cust?.company ?? c.customerId}</td>
                    <td>
                      <span className={`pill status-${c.status}`}>{statusLabel(c.status)}</span>
                    </td>
                    {showCost || showRevOnly ? <td>{yen.format(c.revenue)}</td> : null}
                    {showCost ? (
                      <>
                        <td>{yen.format(c.cost)}</td>
                        <td className={profit < 0 ? 'neg' : ''}>{yen.format(profit)}</td>
                      </>
                    ) : null}
                    <td>{c.period}</td>
                    <td>{new Date(c.updatedAt).toLocaleDateString('ja-JP')}</td>
                    <td className="actions">
                      {canEdit ? (
                        <>
                          <button type="button" className="link-btn" onClick={() => setDraft({ ...c })}>
                            {ja.common.edit}
                          </button>
                          <button type="button" className="link-btn danger" onClick={() => removeCase(c.id)}>
                            {ja.common.delete}
                          </button>
                        </>
                      ) : (
                        <span className="muted">{ja.common.viewOnly}</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {sortedCases.length > 0 ? (
        <PaginationBar
          total={sortedCases.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n as PageSize)
            setPage(1)
          }}
        />
      ) : null}

      {draft ? (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal card">
            <h2>{data.cases.some((c) => c.id === draft.id) ? j.modalEdit : j.modalNew}</h2>
            <div className="form-grid">
              <label className="field">
                <span>{j.fieldTitle}</span>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="field">
                <span>{j.fieldCustomer}</span>
                <select
                  value={draft.customerId}
                  onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}
                >
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{j.fieldStatus}</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as CaseRecord['status'] })}
                >
                  <option value="draft">{j.statusDraft}</option>
                  <option value="active">{j.statusActive}</option>
                  <option value="closed">{j.statusClosed}</option>
                </select>
              </label>
              {showCost || showRevOnly ? (
                <label className="field">
                  <span>{j.fieldRevenue}</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.revenue}
                    onChange={(e) => setDraft({ ...draft, revenue: Number(e.target.value) })}
                  />
                </label>
              ) : null}
              {showCost ? (
                <label className="field">
                  <span>{j.fieldCost}</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.cost}
                    onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })}
                  />
                </label>
              ) : null}
              <label className="field">
                <span>{j.fieldPeriod}</span>
                <input
                  type="month"
                  value={draft.period.length >= 7 ? draft.period.slice(0, 7) : draft.period}
                  onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setDraft(null)}>
                {ja.common.cancel}
              </button>
              <button type="button" className="btn primary" onClick={saveDraft}>
                {ja.common.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function statusLabel(s: CaseRecord['status']) {
  const j = ja.cases
  const map: Record<CaseRecord['status'], string> = {
    draft: j.statusDraft,
    active: j.statusActive,
    closed: j.statusClosed,
  }
  return map[s]
}
