/**
 * AI API proxy - OPENAI_API_KEY or AI_API_KEY (Railway Variables).
 * Optional: OPENAI_BASE_URL, OPENAI_MODEL (default gpt-4o-mini).
 * With NODE_ENV=production, serves ../dist and SPA fallback.
 */
import cors from 'cors'
import express from 'express'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FAQ_KNOWLEDGE = `
[PlusZero CRM / internal portal FAQ]
Q: How to sign in? A: Use email and password. New users: link at bottom of login card.
Q: How to add a case? A: Menu "Cases" -> New case. Enter revenue, cost, period, then save.
Q: Who can import CSV? A: Mainly admin/manager. Bulk import also on Data exchange page.
Q: Task assignee? A: Managers can edit all. Users may edit their own tasks depending on role.
Q: Dashboard numbers? A: Role-based. Sales: revenue focus; admin: cost/profit too.
Q: Notifications? A: Left menu "Notifications". Unread count in badge.
Q: Where is data stored? A: This demo uses browser localStorage. Production would use a backend.
`.trim()

const DOCUMENT_CORPUS = `
[Sample internal document index]
- Business improvement policy 2025: reduce silos, template procedures, dashboard visibility.
- Customer SLA: first reply within 24h; escalate to manager when needed.
- Proposal guideline: problem -> approach -> value -> timeline -> next step. Cite assumptions.
- Compliance: minimize PII; external sharing needs approval.
- Roadmap notes: Q1 CSV enhancements; Q2 company-wide AI assist.
`.trim()

function getApiKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_API_KEY || ''
}

async function chatComplete(system, user, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) {
    const err = new Error(
      'Set OPENAI_API_KEY or AI_API_KEY in Railway Variables (or .env locally).'
    )
    err.code = 'NO_KEY'
    throw err
  }

  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const max_tokens = options.max_tokens ?? 2048

  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.35,
      max_tokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!r.ok) {
    const text = await r.text()
    const err = new Error(`LLM API error (${r.status}): ${text.slice(0, 500)}`)
    err.code = 'UPSTREAM'
    throw err
  }

  const j = await r.json()
  const out = j.choices?.[0]?.message?.content?.trim() ?? ''
  if (!out) {
    const err = new Error('Empty model response.')
    err.code = 'EMPTY'
    throw err
  }
  return out
}

function run() {
  const app = express()
  const port = Number(process.env.PORT || 8787)

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '2mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      hasKey: Boolean(getApiKey()),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    })
  })

  app.post('/api/ai/faq', async (req, res) => {
    try {
      const query = String(req.body?.query ?? '').trim()
      if (!query) return res.status(400).json({ error: 'query is required' })

      const system = `You are an internal FAQ assistant for PlusZero CRM users.
Answer in Japanese. Be concise. Use bullet points when helpful.
Base your answer on the knowledge below; if missing, say so briefly and give generic CRM advice.

${FAQ_KNOWLEDGE}`

      const answer = await chatComplete(system, `Question:\n${query}`)
      res.json({ answer })
    } catch (e) {
      const code = e.code
      const status = code === 'NO_KEY' ? 503 : 500
      res.status(status).json({ error: e.message })
    }
  })

  app.post('/api/ai/documents/search', async (req, res) => {
    try {
      const query = String(req.body?.query ?? '').trim()
      if (!query) return res.status(400).json({ error: 'query is required' })

      const system = `You are a document search assistant. Summarize relevant passages in Japanese from the corpus.
If nothing matches, say so and suggest alternate keywords.

${DOCUMENT_CORPUS}`

      const answer = await chatComplete(system, `Search query:\n${query}`)
      res.json({ answer })
    } catch (e) {
      const status = e.code === 'NO_KEY' ? 503 : 500
      res.status(status).json({ error: e.message })
    }
  })

  app.post('/api/ai/proposal', async (req, res) => {
    try {
      const context = String(req.body?.context ?? '').trim()
      const goal = String(req.body?.goal ?? '').trim()
      if (!context) return res.status(400).json({ error: 'context is required' })

      const system = `You draft B2B proposal outlines in Japanese. Use markdown ## headings.
Include: situation, proposal summary, expected value, rough timeline, next actions.`

      const user = `Background:\n${context}\n${goal ? `\nGoal:\n${goal}` : ''}`
      const answer = await chatComplete(system, user, { max_tokens: 2500 })
      res.json({ answer })
    } catch (e) {
      const status = e.code === 'NO_KEY' ? 503 : 500
      res.status(status).json({ error: e.message })
    }
  })

  app.post('/api/ai/customer-template', async (req, res) => {
    try {
      const situation = String(req.body?.situation ?? '').trim()
      const channel = String(req.body?.channel ?? 'email').trim()
      if (!situation) return res.status(400).json({ error: 'situation is required' })

      const system = `You write polite Japanese customer-response templates for the given channel (email/phone/chat).
Include greeting, body, closing; optional placeholders like [company name].`

      const user = `Channel: ${channel}\nSituation:\n${situation}`
      const answer = await chatComplete(system, user)
      res.json({ answer })
    } catch (e) {
      const status = e.code === 'NO_KEY' ? 503 : 500
      res.status(status).json({ error: e.message })
    }
  })

  app.post('/api/ai/case-assist', async (req, res) => {
    try {
      const title = String(req.body?.title ?? '').trim()
      const notes = String(req.body?.notes ?? '').trim()
      if (!title) return res.status(400).json({ error: 'title is required' })

      const system = `You are a sales case coach. Output in Japanese with bullet lists:
(1) one-line summary (2) risks/checklist (3) three next actions.`

      const user = `Case title: ${title}\n${notes ? `Notes:\n${notes}` : ''}`
      const answer = await chatComplete(system, user)
      res.json({ answer })
    } catch (e) {
      const status = e.code === 'NO_KEY' ? 503 : 500
      res.status(status).json({ error: e.message })
    }
  })

  const distDir = join(__dirname, '..', 'dist')
  const serveSpa =
    process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT)
  if (serveSpa) {
    app.use(express.static(distDir))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(join(distDir, 'index.html'))
    })
  }

  app.listen(port, () => {
    console.log(`[ai-server] listening on ${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`)
  })
}

run()
