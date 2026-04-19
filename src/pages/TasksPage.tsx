import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uid, useAppData } from '../contexts/DataContext'
import { canManageAllTasks } from '../lib/permissions'
import { ja } from '../locales'
import type { TaskRecord } from '../types'

export function TasksPage() {
  const j = ja.tasks
  const { user, users } = useAuth()
  const { data, upsertTask, removeTask } = useAppData()
  const role = user!.role
  const allTasks = canManageAllTasks(role)

  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? ja.common.dash

  const [draft, setDraft] = useState<TaskRecord | null>(null)

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

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1>{j.title}</h1>
          <p className="page-desc">{allTasks ? j.descAll : j.descLimited}</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn primary" onClick={startNew}>
            {j.newTask}
          </button>
        </div>
      </header>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>{j.colTitle}</th>
              <th>{j.colCase}</th>
              <th>{j.colStatus}</th>
              <th>{j.colDue}</th>
              <th>{j.colAssignee}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((t) => {
              const caseTitle = data.cases.find((c) => c.id === t.caseId)?.title ?? ja.common.dash
              const canMutate =
                allTasks || t.assigneeUserId === null || t.assigneeUserId === user!.id
              return (
                <tr key={t.id}>
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
            })}
          </tbody>
        </table>
      </div>

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
