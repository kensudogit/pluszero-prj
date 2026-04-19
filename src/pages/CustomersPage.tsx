import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uid, useAppData } from '../contexts/DataContext'
import { downloadBlob, parseCsv, toCsv } from '../lib/csv'
import { canEditCustomers, canExportCsv, canImportCsv } from '../lib/permissions'
import { ja } from '../locales'
import type { CustomerRecord } from '../types'

export function CustomersPage() {
  const j = ja.customers
  const { user } = useAuth()
  const { data, upsertCustomer, removeCustomer } = useAppData()
  const role = user!.role
  const canEdit = canEditCustomers(role)
  const canOut = canExportCsv(role)
  const canIn = canImportCsv(role)

  const [draft, setDraft] = useState<CustomerRecord | null>(null)

  function startNew() {
    setDraft({
      id: uid('cust'),
      name: '',
      company: '',
      email: '',
      phone: '',
      note: '',
    })
  }

  function saveDraft() {
    if (!draft?.name.trim() || !draft.company.trim()) return
    upsertCustomer(draft)
    setDraft(null)
  }

  function exportCsv() {
    const headers = ['id', 'name', 'company', 'email', 'phone', 'note']
    const rows = data.customers.map((c) => headers.map((h) => String((c as Record<string, unknown>)[h] ?? '')))
    downloadBlob(`customers_${Date.now()}.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8')
  }

  function importCsv(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const { rows } = parseCsv(text)
      for (const r of rows) {
        const id = r.id?.trim()
        if (!id) continue
        upsertCustomer({
          id,
          name: r.name ?? '',
          company: r.company ?? '',
          email: r.email ?? '',
          phone: r.phone ?? '',
          note: r.note ?? '',
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
          {canOut ? (
            <button type="button" className="btn secondary" onClick={exportCsv}>
              {ja.common.exportCsv}
            </button>
          ) : null}
          {canIn ? (
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
              {j.newCustomer}
            </button>
          ) : null}
        </div>
      </header>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>{j.colCompany}</th>
              <th>{j.colContact}</th>
              <th>{ja.common.email}</th>
              <th>{ja.common.phone}</th>
              <th>{ja.common.note}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map((c) => (
              <tr key={c.id}>
                <td>{c.company}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td className="cell-note">{c.note}</td>
                <td className="actions">
                  {canEdit ? (
                    <>
                      <button type="button" className="link-btn" onClick={() => setDraft({ ...c })}>
                        {ja.common.edit}
                      </button>
                      <button type="button" className="link-btn danger" onClick={() => removeCustomer(c.id)}>
                        {ja.common.delete}
                      </button>
                    </>
                  ) : (
                    <span className="muted">{ja.common.viewOnly}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft ? (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal card">
            <h2>{data.customers.some((c) => c.id === draft.id) ? j.modalEdit : j.modalNew}</h2>
            <div className="form-grid">
              <label className="field">
                <span>{j.fieldCompany}</span>
                <input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
              </label>
              <label className="field">
                <span>{j.fieldContact}</span>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <label className="field">
                <span>{j.fieldEmail}</span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </label>
              <label className="field">
                <span>{j.fieldPhone}</span>
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </label>
              <label className="field wide">
                <span>{j.fieldNote}</span>
                <textarea
                  rows={3}
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
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
