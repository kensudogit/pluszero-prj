import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uid, useAppData } from '../contexts/DataContext'
import { canManageAllTasks } from '../lib/permissions'
import { ja } from '../locales'
import type { TaskRecord } from '../types'

function norm(s: string) {
  return s.trim().toLowerCase()
}

export function TasksPage() {
  const j = ja.tasks
  const location = useLocation()
  const { user, users } = useAuth()
  const { data, upsertTask, removeTask } = useAppData()
  const role = user!.role
  const allTasks = canManageAllTasks(role)

  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? ja.common.dash

  const [draft, setDraft] = useState<TaskRecord | null>(null)
  const [filterQ, setFilterQ] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | TaskRecord['status']>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterCase, setFilterCase] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')

  useEffect(() => {
    const id = location.hash.replace(/^#/, '')
    if (!id) return
    const el = document.getElementById(`task-row-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el?.classList.add('row-highlight')
    const t = window.setTimeout(() => el?.classList.remove('row-highlight'), 2200)
    return () => window.clearTimeout(t)
  }, [location.hash])

  function startNew() {
    setDraft({
      id: uid('task'),
      title: '',
      caseId: data.cases[0]?.id ?? null,
      status: 'todo',
      dueDate: null,
      assigneeUserId: user!.id,
    })
  }

  function startEdit(t: TaskRecord) {
    if (!allTasks && t.assigneeUserId !== user!.id && t.assigneeUserId !== null) {
      return
    }
    setDraft({ ...t })
  }

  function saveDraft() {
    if (!draft?.title.trim()) return
    upsertTask({ ...draft })
    setDraft(null)
  }

  const visibleTasks = useMemo(() => {
    if (allTasks) return data.tasks
    return data.tasks.filter((t) => t.assigneeUserId === user!.id || t.assigneeUserId === null)
  }, [allTasks, data.tasks, user])

  const filteredTasks = useMemo(() => {
    let rows = visibleTasks
    if (filterStatus !== 'all') rows = rows.filter((t) => t.status === filterStatus)
    if (filterAssignee !== 'all') {
      if (filterAssignee === '_none') rows = rows.filter((t) => !t.assigneeUserId)
      else rows = rows.filter((t) => t.assigneeUserId === filterAssignee)
    }
    if (filterCase !== 'all') {
      rows = rows.filter((t) =>
        filterCase === '_none' ? t.caseId === null : t.caseId === filterCase
      )
    }
    const q = norm(filterQ)
    if (q) {
      rows = rows.filter((t) => {
        const caseTitle = t.caseId ? data.cases.find((c) => c.id === t.caseId)?.title ?? '' : ''
        const assigneeName = t.assigneeUserId
          ? users.find((u) => u.id === t.assigneeUserId)?.name ?? ''
          : ''
        const blob = [t.title, t.status, caseTitle, assigneeName].join(' ')
        return norm(blob).includes(q)
      })
    }
    return rows
  }, [data.cases, filterAssignee, filterCase, filterQ, filterStatus, users, visibleTasks])

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1>{j.title}</h1>
          <p className="page-desc">{allTasks ? j.descAll : j.descLimited}</p>
        </div>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label={j.viewList}>
            <button
              type="button"
              className={viewMode === 'list' ? 'segmented-btn active' : 'segmented-btn'}
              onClick={() => setViewMode('list')}
            >
              {j.viewList}
            </button>
            <button
              type="button"
              className={viewMode === 'board' ? 'segmented-btn active' : 'segmented-btn'}
              onClick={() => setViewMode('board')}
            >
              {j.viewBoard}
            </button>
          </div>
          <button type="button" className="btn primary" onClick={startNew}>
            {j.newTask}
          </button>
        </div>
      </header>

      <div className="filter-bar card">
        <label className="field compact">
          <span>{j.filterKeyword}</span>
          <input type="search" value={filterQ} onChange={(e) => setFilterQ(e.target.value)} autoComplete="off" />
        </label>
        <label className="field compact">
          <span>{j.colStatus}</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="all">{j.filterStatusAll}</option>
            <option value="todo">{j.statusTodo}</option>
            <option value="doing">{j.statusDoing}</option>
            <option value="done">{j.statusDone}</option>
          </select>
        </label>
        {allTasks ? (
          <label className="field compact">
            <span>{j.filterAssignee}</span>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
              <option value="all">{j.filterAssigneeAll}</option>
              <option value="_none">{ja.common.unassigned}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field compact">
          <span>{j.filterCase}</span>
          <select value={filterCase} onChange={(e) => setFilterCase(e.target.value)}>
            <option value="all">{j.filterCaseAll}</option>
            <option value="_none">{ja.common.none}</option>
            {data.cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {viewMode === 'list' ? (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>{j.colTitle}</th>
                <th>{j.colCase}</th>
                <th>{j.colStatus}</th>
                <th>{j.colDue}</th>
                <th>{j.colAssignee}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    {j.filterEmpty}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const caseTitle = data.cases.find((c) => c.id === t.caseId)?.title ?? ja.common.dash
                  const canMutate =
                    allTasks || t.assigneeUserId === null || t.assigneeUserId === user!.id
                  return (
                    <tr key={t.id} id={`task-row-${t.id}`}>
                      <td>{t.title}</td>
                      <td>{caseTitle}</td>
                      <td>
                        <span className={`pill task-${t.status}`}>{taskStatusLabel(t.status)}</span>
                      </td>
                      <td>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('ja-JP') : ja.common.dash}
                      </td>
                      <td>{userName(t.assigneeUserId)}</td>
                      <td className="actions">
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => startEdit(t)}
                          disabled={!canMutate}
                        >
                          {ja.common.edit}
                        </button>
                        <button
                          type="button"
                          className="link-btn danger"
                          onClick={() => removeTask(t.id)}
                          disabled={!canMutate}
                        >
                          {ja.common.delete}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="task-board card">
          {(['todo', 'doing', 'done'] as const).map((st) => (
            <div key={st} className="task-board-column">
              <h3 className="task-board-heading">
                {taskStatusLabel(st)}
                {' \u00b7 '}
                {filteredTasks.filter((t) => t.status === st).length}
              </h3>
              <div className="task-board-cards">
                {filteredTasks
                  .filter((t) => t.status === st)
                  .map((t) => {
                    const caseTitle = data.cases.find((c) => c.id === t.caseId)?.title ?? ja.common.dash
                    const canMutate =
                      allTasks || t.assigneeUserId === null || t.assigneeUserId === user!.id
                    return (
                      <div key={t.id} className="task-board-card" id={`task-row-${t.id}`}>
                        <div className="task-board-card-title">{t.title}</div>
                        <div className="task-board-card-meta muted">{caseTitle}</div>
                        <div className="task-board-card-meta">
                          {t.dueDate
                            ? `${j.colDue}: ${new Date(t.dueDate).toLocaleDateString('ja-JP')}`
                            : `${j.colDue}: ${ja.common.dash}`}
                        </div>
                        <div className="task-board-card-meta">
                          {j.colAssignee}: {userName(t.assigneeUserId)}
                        </div>
                        <div className="task-board-card-actions">
                          <button
                            type="button"
                            className="link-btn"
                            onClick={() => startEdit(t)}
                            disabled={!canMutate}
                          >
                            {ja.common.edit}
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {draft ? (
        <div className="modal-overlay" role="dialog" aria-modal>
          <div className="modal card">
            <h2>{data.tasks.some((t) => t.id === draft.id) ? j.modalEdit : j.modalNew}</h2>
            <div className="form-grid">
              <label className="field">
                <span>{j.fieldTitle}</span>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="field">
                <span>{j.fieldCaseOptional}</span>
                <select
                  value={draft.caseId ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      caseId: e.target.value === '' ? null : e.target.value,
                    })
                  }
                >
                  <option value="">{ja.common.none}</option>
                  {data.cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{j.fieldStatus}</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as TaskRecord['status'] })
                  }
                >
                  <option value="todo">{j.statusTodo}</option>
                  <option value="doing">{j.statusDoing}</option>
                  <option value="done">{j.statusDone}</option>
                </select>
              </label>
              <label className="field">
                <span>{j.fieldDue}</span>
                <input
                  type="date"
                  value={draft.dueDate ? draft.dueDate.slice(0, 10) : ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </label>
              <label className="field">
                <span>{j.fieldAssignee}</span>
                <select
                  value={draft.assigneeUserId ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      assigneeUserId: e.target.value === '' ? null : e.target.value,
                    })
                  }
                  disabled={!allTasks}
                >
                  <option value="">{ja.common.unassigned}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!allTasks ? <p className="hint">{j.hintAssignee}</p> : null}
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

function taskStatusLabel(s: TaskRecord['status']) {
  const j = ja.tasks
  const map: Record<TaskRecord['status'], string> = {
    todo: j.statusTodo,
    doing: j.statusDoing,
    done: j.statusDone,
  }
  return map[s]
}
