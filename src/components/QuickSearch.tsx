import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/DataContext'
import { ja } from '../locales'

const MAX_SECTION = 6

function norm(s: string) {
  return s.trim().toLowerCase()
}

export function QuickSearch() {
  const j = ja.quickSearch
  const { data } = useAppData()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      queueMicrotask(() => inputRef.current?.focus())
    }
  }, [open])

  const needle = norm(q)
  const results = useMemo(() => {
    if (needle.length < 1) {
      return { cases: [] as typeof data.cases, customers: [] as typeof data.customers, tasks: [] as typeof data.tasks }
    }
    const custMap = new Map(data.customers.map((c) => [c.id, c]))
    const casesHit = data.cases.filter((k) => {
      const c = custMap.get(k.customerId)
      const blob = [k.title, k.status, k.period, c?.company, c?.name].filter(Boolean).join(' ')
      return norm(blob).includes(needle)
    })
    const customersHit = data.customers.filter((c) =>
      norm([c.company, c.name, c.email, c.phone, c.note].join(' ')).includes(needle)
    )
    const tasksHit = data.tasks.filter((t) => {
      const kt = t.caseId ? data.cases.find((k) => k.id === t.caseId) : null
      const blob = [t.title, t.status, kt?.title].filter(Boolean).join(' ')
      return norm(blob).includes(needle)
    })
    return {
      cases: casesHit.slice(0, MAX_SECTION),
      customers: customersHit.slice(0, MAX_SECTION),
      tasks: tasksHit.slice(0, MAX_SECTION),
    }
  }, [data.cases, data.customers, data.tasks, needle])

  const empty =
    needle.length >= 1 &&
    results.cases.length === 0 &&
    results.customers.length === 0 &&
    results.tasks.length === 0

  return (
    <>
      <button type="button" className="quick-search-trigger" onClick={() => setOpen(true)}>
        <span aria-hidden className="quick-search-trigger-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <span className="quick-search-trigger-label">{j.openButton}</span>
        <kbd className="kbd-hint">Ctrl K</kbd>
      </button>

      {open ? (
        <div
          className="modal-overlay quick-search-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="quick-search-panel card"
            role="dialog"
            aria-modal
            aria-label={j.openButton}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quick-search-field">
              <input
                ref={inputRef}
                type="search"
                className="quick-search-input"
                placeholder={j.placeholder}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <span className="quick-search-hint">{j.hintKeys}</span>
            </div>

            {empty ? <p className="quick-search-empty">{j.empty}</p> : null}

            {needle.length >= 1 ? (
              <div className="quick-search-results">
                {results.cases.length > 0 ? (
                  <section className="quick-search-section">
                    <h3>{j.sectionCases}</h3>
                    <ul>
                      {results.cases.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="quick-search-hit"
                            onClick={() => {
                              navigate(`/cases#${c.id}`)
                              setOpen(false)
                            }}
                          >
                            <span className="quick-search-hit-title">{c.title}</span>
                            <span className="quick-search-hit-meta">{c.period}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {results.customers.length > 0 ? (
                  <section className="quick-search-section">
                    <h3>{j.sectionCustomers}</h3>
                    <ul>
                      {results.customers.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="quick-search-hit"
                            onClick={() => {
                              navigate(`/customers#${c.id}`)
                              setOpen(false)
                            }}
                          >
                            <span className="quick-search-hit-title">{c.company}</span>
                            <span className="quick-search-hit-meta">{c.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {results.tasks.length > 0 ? (
                  <section className="quick-search-section">
                    <h3>{j.sectionTasks}</h3>
                    <ul>
                      {results.tasks.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            className="quick-search-hit"
                            onClick={() => {
                              navigate(`/tasks#${t.id}`)
                              setOpen(false)
                            }}
                          >
                            <span className="quick-search-hit-title">{t.title}</span>
                            <span className="quick-search-hit-meta">
                              {t.caseId
                                ? data.cases.find((k) => k.id === t.caseId)?.title ?? ''
                                : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : (
              <p className="quick-search-placeholder-hint muted">{j.placeholder}</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
