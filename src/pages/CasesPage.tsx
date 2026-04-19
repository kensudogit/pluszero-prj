import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uid, useAppData } from '../contexts/DataContext'
import { downloadBlob, parseCsv, toCsv } from '../lib/csv'
import { yen } from '../lib/format'
import {
  canEditCases,
  canExportCsv,
  canImportCsv,
  canViewFinanceDetail,
  canViewRevenueOnly,
} from '../lib/permissions'
import type { CaseRecord } from '../types'

export function CasesPage() {
  const { user } = useAuth()
  const { data, upsertCase, removeCase } = useAppData()
  const role = user!.role
  const canEdit = canEditCases(role)
  const canCsvOut = canExportCsv(role)
  const canCsvIn = canImportCsv(role)
  const showCost = canViewFinanceDetail(role)
  const showRevOnly = canViewRevenueOnly(role)

  const customersById = useMemo(() => new Map(data.customers.map((c) => [c.id, c])), [data.customers])

  const [draft, setDraft] = useState<CaseRecord | null>(null)

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
          <h1>Cases</h1>
          <p className="page-desc">Revenue and cost roll up to the dashboard.</p>
        </div>
        <div className="toolbar">
          {canCsvOut ? (
            <button type="button" className="btn secondary" onClick={exportCsv}>
              Export CSV
            </button>
          ) : null}
          {canCsvIn ? (
            <label className="btn secondary file-btn">
              Import CSV
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
              New case
            </button>
          ) : null}
        </div>
      </header>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Customer</th>
              <th>Status</th>
              {showCost || showRevOnly ? <th>Revenue</th> : null}
              {showCost ? (
                <>
                  <th>Cost</th>
                  <th>Profit</th>
                </>
              ) : null}
              <th>Period</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.cases.map((c) => {
              const cust = customersById.get(c.customerId)
              const profit = c.revenue - c.cost
              return (
                <tr key={c.id}>
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
                  <td className="actions">
                    {canEdit ? (
                      <>
                        <button type="button" className="link-btn" onClick={() => setDraft({ ...c })}>
                          Edit
                        </button>
                        <button type="button" className="link-btn danger" onClick={() => removeCase(c.id)}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="muted">View only</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {draft ? (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal card">
            <h2>{data.cases.some((c) => c.id === draft.id) ? 'Edit case' : 'New case'}</h2>
            <div className="form-grid">
              <label className="field">
                <span>Title</span>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="field">
                <span>Customer</span>
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
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as CaseRecord['status'] })}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              {showCost || showRevOnly ? (
                <label className="field">
                  <span>Revenue (JPY)</span>
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
                  <span>Cost (JPY)</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.cost}
                    onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })}
                  />
                </label>
              ) : null}
              <label className="field">
                <span>Period (YYYY-MM)</span>
                <input
                  type="month"
                  value={draft.period.length >= 7 ? draft.period.slice(0, 7) : draft.period}
                  onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={saveDraft}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function statusLabel(s: CaseRecord['status']) {
  const map: Record<CaseRecord['status'], string> = {
    draft: 'Draft',
    active: 'Active',
    closed: 'Closed',
  }
  return map[s]
}
