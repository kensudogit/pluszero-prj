import { useState } from 'react'
import { ja } from '../locales'

function SectionIcon({ name }: { name: string }) {
  const stroke = '#10b981'
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 2 }
  switch (name) {
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5M8 19v-6M12 19V9M16 19v-9M20 19v-3" />
        </svg>
      )
    case 'task':
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 21v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1M17 21v-1a3 3 0 0 0-2-2.8" />
        </svg>
      )
    case 'csv':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    case 'userPlus':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      )
    default:
      return null
  }
}

export function UsageGuide() {
  const [open, setOpen] = useState(true)
  const ug = ja.usageGuide

  return (
    <div className="usage-guide">
      <button
        type="button"
        className="usage-guide-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="usage-guide-header-inner">
          <svg className="usage-guide-book" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h11V5H6zm3 2h6v2H9V7zm0 4h6v2H9v-2z"
            />
          </svg>
          <span className="usage-guide-title">{ug.title}</span>
        </span>
        <svg
          className={`usage-guide-chevron ${open ? 'open' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {open ? (
        <div className="usage-guide-body">
          <p className="usage-guide-intro">{ug.intro}</p>
          {ug.sections.map((sec) => (
            <section key={sec.n} className="usage-guide-section">
              <h3 className="usage-guide-section-title">
                <span className="usage-guide-num">{sec.n}</span>
                <SectionIcon name={sec.icon} />
                <span>{sec.title}</span>
              </h3>
              <ul className="usage-guide-list">
                {sec.bullets.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}
