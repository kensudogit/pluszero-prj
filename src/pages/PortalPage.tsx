import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/DataContext'
import { aiApiRoot, postAiJson, type TextResult } from '../lib/aiClient'
import { ja } from '../locales'

type Tab = 'faq' | 'doc' | 'proposal' | 'template' | 'cases'

export function PortalPage() {
  const p = ja.portal
  const { data } = useAppData()

  const [tab, setTab] = useState<Tab>('faq')
  const [health, setHealth] = useState<{ ok?: boolean; hasKey?: boolean } | null>(null)

  const [faqQ, setFaqQ] = useState('')
  const [docQ, setDocQ] = useState('')
  const [proposalCtx, setProposalCtx] = useState('')
  const [proposalGoal, setProposalGoal] = useState('')
  const [situation, setSituation] = useState('')
  const [channel, setChannel] = useState('email')
  const [caseTitle, setCaseTitle] = useState('')
  const [caseNotes, setCaseNotes] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const apiHint = useMemo(() => {
    const root = aiApiRoot()
    return root ? `${root}/api` : `${typeof window !== 'undefined' ? window.location.origin : ''}/api`
  }, [])

  const refreshHealth = useCallback(async () => {
    const root = aiApiRoot()
    const url = root ? `${root}/api/health` : '/api/health'
    try {
      const res = await fetch(url)
      if (!res.ok) return setHealth({ ok: false, hasKey: false })
      const j = (await res.json()) as { ok?: boolean; hasKey?: boolean }
      setHealth({ ok: Boolean(j.ok), hasKey: Boolean(j.hasKey) })
    } catch {
      setHealth({ ok: false, hasKey: false })
    }
  }, [])

  useEffect(() => {
    void refreshHealth()
  }, [refreshHealth])

  const run = async (path: string, body: Record<string, unknown>) => {
    setErr('')
    setLoading(true)
    setResult('')
    try {
      const out = await postAiJson<TextResult>(path, body)
      if (out.ok === false) {
        setErr(out.message)
        return
      }
      setResult(out.data.answer)
      void refreshHealth()
    } finally {
      setLoading(false)
    }
  }

  const recentCases = useMemo(() => {
    return [...data.cases]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
  }, [data.cases])

  return (
    <div className="page portal-page">
      <header className="page-header">
        <h1>{p.title}</h1>
        <p className="page-desc">{p.desc}</p>
        <p className="portal-api-line">
          <span className="portal-api-label">API:</span> <code>{apiHint}</code>
          {health ? (
            <span className={health.hasKey ? 'portal-health ok' : 'portal-health warn'}>
              {' '}
              - {health.hasKey ? p.statusOk : p.statusNoKey}
            </span>
          ) : null}
        </p>
      </header>

      <div className="portal-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'faq'}
          className={tab === 'faq' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('faq')}
        >
          {p.tabFaq}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'doc'}
          className={tab === 'doc' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('doc')}
        >
          {p.tabDoc}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'proposal'}
          className={tab === 'proposal' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('proposal')}
        >
          {p.tabProposal}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'template'}
          className={tab === 'template' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('template')}
        >
          {p.tabTemplate}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cases'}
          className={tab === 'cases' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('cases')}
        >
          {p.tabCases}
        </button>
      </div>

      {tab === 'faq' ? (
        <section className="card portal-panel">
          <label className="field">
            <span>{p.queryLabel}</span>
            <textarea
              rows={3}
              value={faqQ}
              onChange={(e) => setFaqQ(e.target.value)}
              placeholder={p.faqPlaceholder}
            />
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={loading}
            onClick={() => void run('/api/ai/faq', { query: faqQ })}
          >
            {p.submit}
          </button>
        </section>
      ) : null}

      {tab === 'doc' ? (
        <section className="card portal-panel">
          <label className="field">
            <span>{p.queryLabel}</span>
            <textarea
              rows={3}
              value={docQ}
              onChange={(e) => setDocQ(e.target.value)}
              placeholder={p.docPlaceholder}
            />
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={loading}
            onClick={() => void run('/api/ai/documents/search', { query: docQ })}
          >
            {p.submit}
          </button>
        </section>
      ) : null}

      {tab === 'proposal' ? (
        <section className="card portal-panel">
          <label className="field">
            <span>{p.proposalContext}</span>
            <textarea
              rows={6}
              value={proposalCtx}
              onChange={(e) => setProposalCtx(e.target.value)}
              placeholder={p.proposalContextPh}
            />
          </label>
          <label className="field">
            <span>{p.proposalGoal}</span>
            <textarea
              rows={2}
              value={proposalGoal}
              onChange={(e) => setProposalGoal(e.target.value)}
              placeholder={p.proposalGoalPh}
            />
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={loading}
            onClick={() =>
              void run('/api/ai/proposal', { context: proposalCtx, goal: proposalGoal || undefined })
            }
          >
            {p.submit}
          </button>
        </section>
      ) : null}

      {tab === 'template' ? (
        <section className="card portal-panel">
          <label className="field">
            <span>{p.templateChannel}</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">{p.channelEmail}</option>
              <option value="chat">{p.channelChat}</option>
              <option value="phone">{p.channelPhone}</option>
            </select>
          </label>
          <label className="field">
            <span>{p.templateSituation}</span>
            <textarea
              rows={5}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder={p.templateSituationPh}
            />
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={loading}
            onClick={() =>
              void run('/api/ai/customer-template', { situation, channel })
            }
          >
            {p.submit}
          </button>
        </section>
      ) : null}

      {tab === 'cases' ? (
        <section className="card portal-panel">
          <p className="portal-cases-intro">{p.casesIntro}</p>
          <p>
            <Link className="btn primary" to="/cases">
              {p.openCasesPage}
            </Link>
          </p>
          <label className="field">
            <span>{p.caseAssistTitle}</span>
            <input
              type="text"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder={p.caseAssistTitlePh}
            />
          </label>
          <label className="field">
            <span>{p.caseAssistNotes}</span>
            <textarea
              rows={4}
              value={caseNotes}
              onChange={(e) => setCaseNotes(e.target.value)}
              placeholder={p.caseAssistNotesPh}
            />
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={loading}
            onClick={() => void run('/api/ai/case-assist', { title: caseTitle, notes: caseNotes })}
          >
            {p.submit}
          </button>
          {recentCases.length > 0 ? (
            <div className="portal-recent-cases">
              <h3 className="portal-subh">{p.recentCases}</h3>
              <ul className="portal-case-list">
                {recentCases.map((c) => (
                  <li key={c.id}>
                    <Link to={`/cases#${c.id}`}>{c.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {(err || loading || result) && (
        <section className="card portal-output">
          {loading ? <p className="portal-loading">{p.loading}</p> : null}
          {err ? (
            <p className="form-error">
              {p.errorPrefix}: {err}
            </p>
          ) : null}
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
              <button type="button" className="btn ghost" onClick={() => setResult('')}>
                {p.clear}
              </button>
            </>
          ) : null}
        </section>
      )}
    </div>
  )
}
