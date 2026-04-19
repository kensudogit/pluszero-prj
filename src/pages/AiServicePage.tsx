import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { aiApiRoot, postAiJson, type ChatApiResult, type TextResult, type TranscribeResult } from '../lib/aiClient'
import { ja } from '../locales'

type Tab =
  | 'chat'
  | 'faq'
  | 'summary'
  | 'proposal'
  | 'search'
  | 'voice'
  | 'vision'
  | 'automation'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

function dataUrlToBase64(dataUrl: string): string {
  const i = dataUrl.indexOf(',')
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl
}

/** Web Speech API (prefixed in some browsers) - minimal typing for recognition only */
type BrowserSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: { results: Iterable<{ 0?: { transcript?: string } }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result ?? ''))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function makeSpeechRecognition(): BrowserSpeechRecognition | null {
  const w = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return C ? new C() : null
}

export function AiServicePage() {
  const p = ja.aiService
  const [tab, setTab] = useState<Tab>('chat')
  const [health, setHealth] = useState<{ ok?: boolean; hasKey?: boolean } | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const [faqQ, setFaqQ] = useState('')
  const [sumText, setSumText] = useState('')
  const [proposalCtx, setProposalCtx] = useState('')
  const [proposalGoal, setProposalGoal] = useState('')
  const [docQ, setDocQ] = useState('')
  const [voiceText, setVoiceText] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef<BrowserSpeechRecognition | null>(null)

  const [visionPrompt, setVisionPrompt] = useState('')
  const [autoTask, setAutoTask] = useState('')

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const runJson = async (path: string, body: Record<string, unknown>, pick: (d: { answer?: string }) => string) => {
    setErr('')
    setLoading(true)
    setResult('')
    try {
      const out = await postAiJson<TextResult>(path, body)
      if (out.ok === false) {
        setErr(out.message)
        return
      }
      const text = pick(out.data)
      setResult(text)
      void refreshHealth()
    } finally {
      setLoading(false)
    }
  }

  const sendChat = async () => {
    const t = chatInput.trim()
    if (!t || loading) return

    const nextMsgs: ChatMsg[] = [...chatMessages, { role: 'user', content: t }]
    setChatInput('')
    setErr('')
    setLoading(true)
    try {
      const out = await postAiJson<ChatApiResult>('/api/ai/chat', {
        messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
      })
      if (out.ok === false) {
        setErr(out.message)
        setChatInput(t)
        return
      }
      setChatMessages([...nextMsgs, { role: 'assistant', content: out.data.answer }])
      void refreshHealth()
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setChatMessages([])
    setChatInput('')
    setErr('')
  }

  const startListen = () => {
    const rec = makeSpeechRecognition()
    if (!rec) {
      setErr('Speech recognition is not supported in this browser.')
      return
    }
    rec.lang = 'ja-JP'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (ev) => {
      const text = Array.from(ev.results)
        .map((r) => r[0]?.transcript ?? '')
        .join('')
        .trim()
      if (text) setVoiceText((prev) => (prev ? `${prev}\n${text}` : text))
    }
    rec.onerror = () => {
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const stopListen = () => {
    recRef.current?.stop()
    setListening(false)
  }

  const sendVoiceToChat = () => {
    const t = voiceText.trim()
    if (!t) return
    setChatInput(t)
    setTab('chat')
  }

  const transcribeFile = async (file: File | null) => {
    if (!file) return
    setErr('')
    setLoading(true)
    setResult('')
    try {
      const dataUrl = await fileToDataUrl(file)
      const base64 = dataUrlToBase64(dataUrl)
      const mimeType = file.type || 'audio/webm'
      const out = await postAiJson<TranscribeResult>('/api/ai/transcribe', {
        audioBase64: base64,
        mimeType,
      })
      if (out.ok === false) {
        setErr(out.message)
        return
      }
      setVoiceText((prev) => (prev ? `${prev}\n${out.data.text}` : out.data.text))
      setResult(out.data.text)
      void refreshHealth()
    } finally {
      setLoading(false)
    }
  }

  const analyzeImage = async (file: File | null) => {
    if (!file) return
    setErr('')
    setLoading(true)
    setResult('')
    try {
      const dataUrl = await fileToDataUrl(file)
      const base64 = dataUrlToBase64(dataUrl)
      const mimeType = file.type || 'image/png'
      const out = await postAiJson<TextResult>('/api/ai/vision', {
        imageBase64: base64,
        mimeType,
        prompt: visionPrompt.trim() || undefined,
      })
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

  return (
    <div className="page portal-page ai-service-page">
      <header className="page-header">
        <h1>{p.title}</h1>
        <p className="page-desc">{p.desc}</p>
        <p className="portal-api-line">
          <span className="portal-api-label">{p.apiLabel}:</span> <code>{apiHint}</code>
          {health ? (
            <span className={health.hasKey ? 'portal-health ok' : 'portal-health warn'}>
              {' '}
              - {health.hasKey ? p.statusOk : p.statusNoKey}
            </span>
          ) : null}
        </p>
      </header>

      <div className="portal-tabs ai-service-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={tab === 'chat' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('chat')}
        >
          {p.tabChat}
        </button>
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
          aria-selected={tab === 'summary'}
          className={tab === 'summary' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('summary')}
        >
          {p.tabSummary}
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
          aria-selected={tab === 'search'}
          className={tab === 'search' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('search')}
        >
          {p.tabSearch}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'voice'}
          className={tab === 'voice' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('voice')}
        >
          {p.tabVoice}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'vision'}
          className={tab === 'vision' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('vision')}
        >
          {p.tabVision}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'automation'}
          className={tab === 'automation' ? 'portal-tab active' : 'portal-tab'}
          onClick={() => setTab('automation')}
        >
          {p.tabAutomation}
        </button>
      </div>

      {err ? (
        <p className="form-error" role="alert">
          {p.errorPrefix}: {err}
        </p>
      ) : null}

      {tab === 'chat' ? (
        <section className="portal-panel ai-chat-panel" aria-labelledby="ai-chat-h">
          <h2 id="ai-chat-h" className="portal-subh">
            {p.tabChat}
          </h2>
          <p className="page-desc ai-chat-hint">{p.chatHint}</p>
          <div className="ai-chat-log">
            {chatMessages.map((m, i) => (
              <div key={i} className={`ai-chat-bubble ${m.role}`}>
                <div className="ai-chat-role">{m.role === 'user' ? p.chatRoleUser : p.chatRoleAi}</div>
                <pre className="portal-pre ai-chat-pre">{m.content}</pre>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="ai-chat-input-row">
            <textarea
              className="field-input ai-chat-field"
              rows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={p.chatPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  void sendChat()
                }
              }}
            />
            <div className="ai-chat-actions">
              <button type="button" className="btn primary" disabled={loading} onClick={() => void sendChat()}>
                {loading ? p.loading : p.chatSend}
              </button>
              <button type="button" className="btn ghost" onClick={clearChat}>
                {p.chatClear}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'faq' ? (
        <section className="portal-panel" aria-labelledby="ai-faq-h">
          <h2 id="ai-faq-h" className="portal-subh">
            {p.tabFaq}
          </h2>
          <label className="field">
            <span>{p.faqLabel}</span>
            <textarea
              className="field-input"
              rows={4}
              value={faqQ}
              onChange={(e) => setFaqQ(e.target.value)}
              placeholder={p.faqPlaceholder}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn primary"
              disabled={loading}
              onClick={() => void runJson('/api/ai/faq', { query: faqQ }, (d) => d.answer ?? '')}
            >
              {loading ? p.loading : p.submit}
            </button>
            <button type="button" className="btn ghost" onClick={() => setResult('')}>
              {p.clear}
            </button>
          </div>
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {tab === 'summary' ? (
        <section className="portal-panel" aria-labelledby="ai-sum-h">
          <h2 id="ai-sum-h" className="portal-subh">
            {p.tabSummary}
          </h2>
          <label className="field">
            <span>{p.summaryLabel}</span>
            <textarea
              className="field-input"
              rows={12}
              value={sumText}
              onChange={(e) => setSumText(e.target.value)}
              placeholder={p.summaryPlaceholder}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn primary"
              disabled={loading}
              onClick={() => void runJson('/api/ai/summarize', { text: sumText }, (d) => d.answer ?? '')}
            >
              {loading ? p.loading : p.submit}
            </button>
          </div>
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {tab === 'proposal' ? (
        <section className="portal-panel" aria-labelledby="ai-prop-h">
          <h2 id="ai-prop-h" className="portal-subh">
            {p.tabProposal}
          </h2>
          <label className="field">
            <span>{p.proposalContext}</span>
            <textarea
              className="field-input"
              rows={6}
              value={proposalCtx}
              onChange={(e) => setProposalCtx(e.target.value)}
              placeholder={p.proposalContextPh}
            />
          </label>
          <label className="field">
            <span>{p.proposalGoal}</span>
            <textarea
              className="field-input"
              rows={3}
              value={proposalGoal}
              onChange={(e) => setProposalGoal(e.target.value)}
              placeholder={p.proposalGoalPh}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn primary"
              disabled={loading}
              onClick={() =>
                void runJson(
                  '/api/ai/proposal',
                  { context: proposalCtx, goal: proposalGoal },
                  (d) => d.answer ?? ''
                )
              }
            >
              {loading ? p.loading : p.submit}
            </button>
          </div>
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {tab === 'search' ? (
        <section className="portal-panel" aria-labelledby="ai-doc-h">
          <h2 id="ai-doc-h" className="portal-subh">
            {p.tabSearch}
          </h2>
          <label className="field">
            <span>{p.searchLabel}</span>
            <textarea
              className="field-input"
              rows={4}
              value={docQ}
              onChange={(e) => setDocQ(e.target.value)}
              placeholder={p.searchPlaceholder}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn primary"
              disabled={loading}
              onClick={() => void runJson('/api/ai/documents/search', { query: docQ }, (d) => d.answer ?? '')}
            >
              {loading ? p.loading : p.submit}
            </button>
          </div>
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {tab === 'voice' ? (
        <section className="portal-panel" aria-labelledby="ai-voice-h">
          <h2 id="ai-voice-h" className="portal-subh">
            {p.tabVoice}
          </h2>
          <div className="ai-voice-block">
            <h3 className="portal-subh">{p.voiceBrowser}</h3>
            <p className="page-desc">{p.voiceHint}</p>
            <div className="form-actions">
              {!listening ? (
                <button type="button" className="btn primary" onClick={startListen}>
                  {p.voiceStart}
                </button>
              ) : (
                <button type="button" className="btn ghost" onClick={stopListen}>
                  {p.voiceStop}
                </button>
              )}
              <button type="button" className="btn secondary" disabled={!voiceText.trim()} onClick={sendVoiceToChat}>
                {p.voiceSendChat}
              </button>
            </div>
          </div>
          <div className="ai-voice-block">
            <h3 className="portal-subh">{p.voiceWhisper}</h3>
            <p className="page-desc">{p.voiceWhisperHint}</p>
            <label className="field">
              <span>{p.voiceFile}</span>
              <input
                type="file"
                accept="audio/*,.webm,.wav,.mp3,.m4a,.ogg"
                onChange={(e) => void transcribeFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <label className="field">
            <span>{p.result}</span>
            <textarea
              className="field-input"
              rows={8}
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
            />
          </label>
        </section>
      ) : null}

      {tab === 'vision' ? (
        <section className="portal-panel" aria-labelledby="ai-vis-h">
          <h2 id="ai-vis-h" className="portal-subh">
            {p.tabVision}
          </h2>
          <label className="field">
            <span>{p.visionPrompt}</span>
            <textarea
              className="field-input"
              rows={2}
              value={visionPrompt}
              onChange={(e) => setVisionPrompt(e.target.value)}
              placeholder={p.visionPromptPh}
            />
          </label>
          <label className="field">
            <span>{p.visionChoose}</span>
            <input type="file" accept="image/*" onChange={(e) => void analyzeImage(e.target.files?.[0] ?? null)} />
          </label>
          {loading ? <p className="portal-loading">{p.loading}</p> : null}
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {tab === 'automation' ? (
        <section className="portal-panel" aria-labelledby="ai-auto-h">
          <h2 id="ai-auto-h" className="portal-subh">
            {p.tabAutomation}
          </h2>
          <label className="field">
            <span>{p.automationLabel}</span>
            <textarea
              className="field-input"
              rows={8}
              value={autoTask}
              onChange={(e) => setAutoTask(e.target.value)}
              placeholder={p.automationPlaceholder}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn primary"
              disabled={loading}
              onClick={() => void runJson('/api/ai/automation', { task: autoTask }, (d) => d.answer ?? '')}
            >
              {loading ? p.loading : p.submit}
            </button>
          </div>
          {result ? (
            <>
              <h3 className="portal-subh">{p.result}</h3>
              <pre className="portal-pre">{result}</pre>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
