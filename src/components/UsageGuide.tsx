import { useState } from 'react'

// Copy: Unicode escapes only; UI matches green-header manual panel.
const T = {
  title: '\u5229\u7528\u624b\u9806',
  intro:
    'PlusZero CRM \u306e\u5404\u6a5f\u80fd\u306e\u4f7f\u3044\u65b9\u3067\u3059\u3002\u521d\u3081\u3066\u304a\u4f7f\u3044\u306b\u306a\u308b\u969b\u306f\u3001\u4e0a\u304b\u3089\u9806\u306b\u3054\u78ba\u8a8d\u304f\u3060\u3055\u3044\u3002',
  sections: [
    {
      n: 1,
      title: '\u30ed\u30b0\u30a4\u30f3\u8a8d\u8a3c',
      icon: 'lock',
      bullets: [
        '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3068\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3001\u300cSign in\u300d\u3092\u30af\u30ea\u30c3\u30af\u3057\u3066\u30b5\u30a4\u30f3\u30a4\u30f3\u3057\u307e\u3059\u3002',
        '\u30c7\u30e2\u7528\u30a2\u30ab\u30a6\u30f3\u30c8\u306f\u3001\u300cDemo users\u300d\u3092\u958b\u3044\u3066 `admin@demo.com` / `demo123` \u7b49\u3092\u3054\u5229\u7528\u304f\u3060\u3055\u3044\u3002',
        '\u30bb\u30c3\u30b7\u30e7\u30f3\u60c5\u5831\u306f\u30d6\u30e9\u30a6\u30b6\u5185\u306b\u4fdd\u5b58\u3055\u308c\u307e\u3059\uff08\u691c\u8a3c\u7528\u30c7\u30e2\u3067\u3059\uff09\u3002',
      ],
    },
    {
      n: 2,
      title: '\u6848\u4ef6\u4e00\u89a7',
      icon: 'briefcase',
      bullets: [
        '\u5de6\u30e1\u30cb\u30e5\u30fc\u306e\u300cCases\u300d\u3092\u9078\u629e\u3057\u3001\u6848\u4ef6\u3092\u4e00\u89a7\u3057\u307e\u3059\u3002',
        '\u300cNew case\u300d\u3067\u65b0\u898f\u4f5c\u6210\u3001\u5404\u884c\u306e\u300cEdit\u300d\u300cDelete\u300d\u3067\u7de8\u96c6\u30fb\u524a\u9664\u3057\u307e\u3059\uff08\u8868\u793a\u306f\u6a29\u9650\u306b\u3088\u308a\u7570\u306a\u308a\u307e\u3059\uff09\u3002',
        '\u58f2\u4e0a\u30fb\u539f\u4fa1\u30fb\u5229\u76ca\u306e\u5217\u306f\u3001\u30ed\u30fc\u30eb\u306b\u5fdc\u3058\u3066\u8868\u793a\u3055\u308c\u307e\u3059\u3002',
      ],
    },
    {
      n: 3,
      title: '\u58f2\u4e0a\u30fb\u539f\u4fa1\u30fb\u5229\u76ca\u306e\u53ef\u8996\u5316',
      icon: 'chart',
      bullets: [
        '\u300cDashboard\u300d\u3067 KPI \u30ab\u30fc\u30c9\u3068\u6708\u6b21\u306e\u68d2\u30b0\u30e9\u30d5\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002',
        '\u7ba1\u7406\u8005\u30fb\u30de\u30cd\u30fc\u30b8\u30e3\u30fc\u306f\u58f2\u4e0a\u30fb\u539f\u4fa1\u30fb\u5229\u76ca\u3092\u3001\u55b6\u696d\u306f\u58f2\u4e0a\u306e\u307f\u306a\u3069\u3001\u8868\u793a\u5185\u5bb9\u304c\u5909\u308f\u308a\u307e\u3059\u3002',
        '\u30b9\u30bf\u30c3\u30d5\u306f\u8ca1\u52d9\u30c1\u30e3\u30fc\u30c8\u304c\u96a0\u3055\u308c\u308b\u5834\u5408\u304c\u3042\u308a\u307e\u3059\u3002',
      ],
    },
    {
      n: 4,
      title: '\u30bf\u30b9\u30af\u7ba1\u7406',
      icon: 'task',
      bullets: [
        '\u300cTasks\u300d\u3067\u30bf\u30b9\u30af\u306e\u4e00\u89a7\u3001\u8ffd\u52a0\u3001\u7de8\u96c6\u3092\u884c\u3044\u307e\u3059\u3002',
        '\u300cNew task\u300d\u304b\u3089\u6848\u4ef6\u3068\u306e\u7d10\u3065\u3051\u3001\u671f\u9650\u3001\u62c5\u5f53\u8005\u3092\u8a2d\u5b9a\u3067\u304d\u307e\u3059\u3002',
        '\u62c5\u5f53\u306e\u5909\u66f4\u306f\u3001\u30de\u30cd\u30fc\u30b8\u30e3\u30fc\u4ee5\u4e0a\u306a\u3069\u306e\u5834\u5408\u306b\u9650\u5b9a\u3055\u308c\u308b\u3053\u3068\u304c\u3042\u308a\u307e\u3059\u3002',
      ],
    },
    {
      n: 5,
      title: '\u9867\u5ba2\u7ba1\u7406',
      icon: 'users',
      bullets: [
        '\u300cCustomers\u300d\u3067\u9867\u5ba2\u30de\u30b9\u30bf\u3092\u7de8\u96c6\u3057\u307e\u3059\u3002',
        '\u6848\u4ef6\u3084 CSV \u3068\u9023\u643a\u3059\u308b\u305f\u3081\u3001\u5148\u306b\u9867\u5ba2\u3092\u767b\u9332\u3057\u3066\u304a\u304f\u3068\u30b9\u30e0\u30fc\u30ba\u3067\u3059\u3002',
        '\u300cExport CSV\u300d\u300cImport CSV\u300d\u306f\u6a29\u9650\u306b\u3088\u308a\u5229\u7528\u3067\u304d\u307e\u3059\u3002',
      ],
    },
    {
      n: 6,
      title: 'CSV \u306e\u5165\u51fa\u529b',
      icon: 'csv',
      bullets: [
        '\u6848\u4ef6\u306a\u3069\u306e\u753b\u9762\u3067\u300cExport CSV\u300d\u300cImport CSV\u300d\u304c\u5229\u7528\u3067\u304d\u308b\u5834\u5408\u304c\u3042\u308a\u307e\u3059\u3002\u30a4\u30f3\u30dd\u30fc\u30c8\u306f\u7ba1\u7406\u8005\u30fb\u30de\u30cd\u30fc\u30b8\u30e3\u30fc\u306a\u3069\u306e\u5834\u5408\u306b\u9650\u5b9a\u3055\u308c\u307e\u3059\u3002',
        '\u300cData\u300d\u753b\u9762\u3067 CSV \u306e\u5217\u5b9a\u7fa9\u3092\u78ba\u8a8d\u3067\u304d\u3001JSON \u3067\u306e\u30d5\u30eb\u30d0\u30c3\u30af\u30a2\u30c3\u30d7\u30fb\u5fa9\u5143\u3082\u884c\u3048\u307e\u3059\u3002',
        '\u53d6\u308a\u8fbc\u307f\u6642\u306f\u3001\u540c\u3058 ID \u306e\u884c\u306f\u4e0a\u66f8\u304d\uff08\u30de\u30fc\u30b8\uff09\u3055\u308c\u307e\u3059\u3002',
      ],
    },
    {
      n: 7,
      title: '\u6a29\u9650\u5225\u30e1\u30cb\u30e5\u30fc\u8868\u793a',
      icon: 'shield',
      bullets: [
        '\u5de6\u30b5\u30a4\u30c9\u30d0\u30fc\u306e\u9805\u76ee\u306f\u3001\u30ed\u30fc\u30eb\uff08Admin / Manager / Sales / Staff\uff09\u306b\u3088\u3063\u3066\u7570\u306a\u308a\u307e\u3059\u3002',
        '\u4f8b\uff1aStaff \u306f\u300cCustomers\u300d\u300cData\u300d\u304c\u8868\u793a\u3055\u308c\u306a\u3044\u5834\u5408\u304c\u3042\u308a\u307e\u3059\u3002',
        'URL \u3092\u76f4\u63a5\u958b\u3044\u3066\u3082\u3001\u8a31\u53ef\u306e\u306a\u3044\u753b\u9762\u306f\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u3078\u623b\u308a\u307e\u3059\u3002',
      ],
    },
    {
      n: 8,
      title: '\u901a\u77e5\u6a5f\u80fd',
      icon: 'bell',
      bullets: [
        '\u300cAlerts\u300d\u306b\u3001\u30b5\u30a4\u30f3\u30a4\u30f3\u6210\u529f\u3084 CSV \u53d6\u308a\u8fbc\u307f\u5b8c\u4e86\u306a\u3069\u306e\u30e1\u30c3\u30bb\u30fc\u30b8\u304c\u8ca1\u307e\u308c\u307e\u3059\u3002',
        '\u672a\u8aad\u306e\u4ef6\u6570\u306f\u3001\u30e1\u30cb\u30e5\u30fc\u306b\u30d0\u30c3\u30b8\u8868\u793a\u3055\u308c\u307e\u3059\u3002',
        '\u300cMark all read\u300d\u3067\u4e00\u62ec\u3067\u65e2\u8aad\u306b\u3067\u304d\u307e\u3059\u3002',
      ],
    },
  ],
} as const

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
    default:
      return null
  }
}

export function UsageGuide() {
  const [open, setOpen] = useState(true)

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
          <span className="usage-guide-title">{T.title}</span>
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
          <p className="usage-guide-intro">{T.intro}</p>
          {T.sections.map((sec) => (
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
