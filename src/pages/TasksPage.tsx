import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uid, useAppData } from '../contexts/DataContext'
import { loadUsers } from '../storage/appStorage'
import { canManageAllTasks } from '../lib/permissions'
import type { TaskRecord } from '../types'

export function TasksPage() {
  const { user } = useAuth()
  const { data, upsertTask, removeTask } = useAppData()
  const role = user!.role
  const allTasks = canManageAllTasks(role)

  const users = useMemo(() => loadUsers(), [])
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? '-'

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
          <h1>Tasks</h1>
          <p className="page-desc">
            {allTasks ? 'Manage tasks for everyone.' : 'Shows tasks assigned to you or unassigned.'}
          </p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn primary" onClick={startNew}>
            New task
          </button>
        </div>
      </header>

      <div className="table-wrap card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Case</th>
              <th>Status</th>
              <th>Due</th>
              <th>Assignee</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((t) => {
              const caseTitle = data.cases.find((c) => c.id === t.caseId)?.title ?? '-'
              const canMutate =
                allTasks ||
                t.assigneeUserId === null ||
                t.assigneeUserId === user!.id
              return (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{caseTitle}</td>
                  <td>
                    <span className={`pill task-${t.status}`}>{taskStatusLabel(t.status)}</span>
                  </td>
                  <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                  <td>{userName(t.assigneeUserId)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => startEdit(t)}
                      disabled={!canMutate}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => removeTask(t.id)}
                      disabled={!canMutate}
                    >
                      Delete
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
            <h2>{data.tasks.some((t) => t.id === draft.id) ? 'Edit task' : 'New task'}</h2>
            <div className="form-grid">
              <label className="field">
                <span>Title</span>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="field">
                <span>Case (optional)</span>
                <select
                  value={draft.caseId ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      caseId: e.target.value === '' ? null : e.target.value,
                    })
                  }
                >
                  <option value="">None</option>
                  {data.cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as TaskRecord['status'] })
                  }
                >
                  <option value="todo">Todo</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label className="field">
                <span>Due date</span>
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
                <span>Assignee</span>
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
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!allTasks ? (
              <p className="hint">Only managers can change assignee. You can edit your own tasks.</p>
            ) : null}
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

function taskStatusLabel(s: TaskRecord['status']) {
  const map: Record<TaskRecord['status'], string> = {
    todo: 'Todo',
    doing: 'Doing',
    done: 'Done',
  }
  return map[s]
}
