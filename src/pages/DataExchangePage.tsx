import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/DataContext'
import { useNotifications } from '../contexts/NotificationContext'
import { downloadBlob, parseCsv, toCsv } from '../lib/csv'
import { canImportCsv } from '../lib/permissions'
import type { AppData, CaseRecord, CustomerRecord, TaskRecord } from '../types'

function isAppData(x: unknown): x is AppData {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return Array.isArray(o.cases) && Array.isArray(o.tasks) && Array.isArray(o.customers)
}

export function DataExchangePage() {
  const { user } = useAuth()
  const { data, upsertCase, upsertCustomer, upsertTask, replaceAll } = useAppData()
  const { push } = useNotifications()
  const canIn = canImportCsv(user!.role)

  function exportCases() {
    const headers = ['id', 'title', 'customerId', 'status', 'revenue', 'cost', 'period', 'updatedAt']
    const rows = data.cases.map((c) =>
      headers.map((h) => String((c as Record<string, unknown>)[h] ?? ''))
    )
    downloadBlob(`cases_${Date.now()}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
    push('Export complete', 'Cases CSV downloaded.')
  }

  function importCases(file: File) {
    if (!canIn) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const { rows } = parseCsv(text)
      let n = 0
      for (const r of rows) {
        const id = r.id?.trim()
        if (!id) continue
        const row: CaseRecord = {
          id,
          title: r.title ?? '',
          customerId: r.customerId ?? '',
          status: (r.status as CaseRecord['status']) || 'draft',
          revenue: Number(r.revenue) || 0,
          cost: Number(r.cost) || 0,
          period: r.period || `${new Date().getFullYear()}-01`,
          updatedAt: r.updatedAt || new Date().toISOString(),
        }
        upsertCase(row)
        n++
      }
      push('Import complete', `${n} case row(s) merged.`)
    }
    reader.readAsText(file)
  }

  function importCustomers(file: File) {
    if (!canIn) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const { rows } = parseCsv(text)
      let n = 0
      for (const r of rows) {
        const id = r.id?.trim()
        if (!id) continue
        const row: CustomerRecord = {
          id,
          name: r.name ?? '',
          company: r.company ?? '',
          email: r.email ?? '',
          phone: r.phone ?? '',
          note: r.note ?? '',
        }
        upsertCustomer(row)
        n++
      }
      push('Import complete', `${n} customer row(s) merged.`)
    }
    reader.readAsText(file)
  }

  function importTasks(file: File) {
    if (!canIn) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const { rows } = parseCsv(text)
      let n = 0
      for (const r of rows) {
        const id = r.id?.trim()
        if (!id) continue
        const row: TaskRecord = {
          id,
          title: r.title ?? '',
          caseId: r.caseId?.trim() ? r.caseId : null,
          status: (r.status as TaskRecord['status']) || 'todo',
          dueDate: r.dueDate?.trim() ? r.dueDate : null,
          assigneeUserId: r.assigneeUserId?.trim() ? r.assigneeUserId : null,
        }
        upsertTask(row)
        n++
      }
      push('Import complete', `${n} task row(s) merged.`)
    }
    reader.readAsText(file)
  }

  function backupJson() {
    const blob = JSON.stringify(data, null, 2)
    downloadBlob(`backup_${Date.now()}.json`, blob, 'application/json')
    push('Backup', 'JSON backup downloaded.')
  }

  function restoreJson(file: File) {
    if (!canIn) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ''))
        if (!isAppData(parsed)) {
          push('Error', 'Invalid backup shape (need cases, tasks, customers arrays).')
          return
        }
        replaceAll(parsed)
        push('Restore complete', 'Data replaced from backup.')
      } catch {
        push('Error', 'Could not parse JSON.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Data exchange</h1>
        <p className="page-desc">CSV column reference and bulk tools (admin / manager).</p>
      </header>

      <section className="card prose">
        <h2>CSV columns</h2>
        <ul>
          <li>
            <strong>Cases</strong>: id, title, customerId, status (draft | active | closed), revenue, cost,
            period (YYYY-MM), updatedAt (ISO)
          </li>
          <li>
            <strong>Customers</strong>: id, name, company, email, phone, note
          </li>
          <li>
            <strong>Tasks</strong>: id, title, caseId (optional), status (todo | doing | done), dueDate
            (ISO or empty), assigneeUserId (optional)
          </li>
        </ul>
      </section>

      <section className="card-grid">
        <div className="card">
          <h3>Cases CSV</h3>
          <p className="muted">Export is also on the Cases screen.</p>
          <div className="btn-row">
            <button type="button" className="btn secondary" onClick={exportCases}>
              Download cases
            </button>
            {canIn ? (
              <label className="btn primary file-btn">
                Import
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importCases(f)
                    e.target.value = ''
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>
        <div className="card">
          <h3>Customers CSV</h3>
          <div className="btn-row">
            {canIn ? (
              <label className="btn primary file-btn">
                Import
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importCustomers(f)
                    e.target.value = ''
                  }}
                />
              </label>
            ) : (
              <p className="muted">No permission.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3>Tasks CSV</h3>
          <div className="btn-row">
            {canIn ? (
              <label className="btn primary file-btn">
                Import
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) importTasks(f)
                    e.target.value = ''
                  }}
                />
              </label>
            ) : (
              <p className="muted">No permission.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Full backup (JSON)</h2>
        <p className="muted">Snapshot cases, customers, and tasks together.</p>
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={backupJson}>
            Download JSON
          </button>
          {canIn ? (
            <label className="btn primary file-btn">
              Restore from file
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) restoreJson(f)
                  e.target.value = ''
                }}
              />
            </label>
          ) : null}
        </div>
      </section>
    </div>
  )
}
