import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/DataContext'
import { useNotifications } from '../contexts/NotificationContext'
import { downloadBlob, parseCsv, toCsv } from '../lib/csv'
import { canImportCsv } from '../lib/permissions'
import { interpolate, ja } from '../locales'
import type { AppData, CaseRecord, CustomerRecord, TaskRecord } from '../types'

function isAppData(x: unknown): x is AppData {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return Array.isArray(o.cases) && Array.isArray(o.tasks) && Array.isArray(o.customers)
}

export function DataExchangePage() {
  const j = ja.dataExchange
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
    push(j.notifyExportCases, j.notifyExportCasesBody)
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
      push(j.notifyImportCases, interpolate(j.notifyImportCasesBody, { n }))
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
      push(j.notifyImportCustomers, interpolate(j.notifyImportCustomersBody, { n }))
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
      push(j.notifyImportTasks, interpolate(j.notifyImportTasksBody, { n }))
    }
    reader.readAsText(file)
  }

  function backupJson() {
    const blob = JSON.stringify(data, null, 2)
    downloadBlob(`backup_${Date.now()}.json`, blob, 'application/json')
    push(j.notifyBackup, j.notifyBackupBody)
  }

  function restoreJson(file: File) {
    if (!canIn) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ''))
        if (!isAppData(parsed)) {
          push(j.notifyRestoreBad, j.notifyRestoreBadShape)
          return
        }
        replaceAll(parsed)
        push(j.notifyRestoreOk, j.notifyRestoreOkBody)
      } catch {
        push(j.notifyRestoreBad, j.notifyRestoreBadParse)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{j.title}</h1>
        <p className="page-desc">{j.desc}</p>
      </header>

      <section className="card prose">
        <h2>{j.csvColumnsTitle}</h2>
        <ul>
          <li>
            <strong>{ja.nav.cases}</strong>: {j.csvCasesDesc}
          </li>
          <li>
            <strong>{ja.nav.customers}</strong>: {j.csvCustomersDesc}
          </li>
          <li>
            <strong>{ja.nav.tasks}</strong>: {j.csvTasksDesc}
          </li>
        </ul>
      </section>

      <section className="card-grid">
        <div className="card">
          <h3>{j.cardCasesCsv}</h3>
          <p className="muted">{j.cardCasesHint}</p>
          <div className="btn-row">
            <button type="button" className="btn secondary" onClick={exportCases}>
              {j.downloadCases}
            </button>
            {canIn ? (
              <label className="btn primary file-btn">
                {j.importBtn}
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
          <h3>{j.cardCustomersCsv}</h3>
          <div className="btn-row">
            {canIn ? (
              <label className="btn primary file-btn">
                {j.importBtn}
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
              <p className="muted">{ja.common.permissionDenied}</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3>{j.cardTasksCsv}</h3>
          <div className="btn-row">
            {canIn ? (
              <label className="btn primary file-btn">
                {j.importBtn}
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
              <p className="muted">{ja.common.permissionDenied}</p>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>{j.backupTitle}</h2>
        <p className="muted">{j.backupDesc}</p>
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={backupJson}>
            {j.downloadJson}
          </button>
          {canIn ? (
            <label className="btn primary file-btn">
              {j.restoreJson}
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
