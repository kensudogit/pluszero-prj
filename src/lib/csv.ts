/** Minimal RFC 4180-style CSV with quoted-field escape */

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))]
  return '\uFEFF' + lines.join('\r\n')
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalized = text.replace(/^\uFEFF/, '').trim()
  if (!normalized) return { headers: [], rows: [] }

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]!
    const next = normalized[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === ',') {
      row.push(cell)
      cell = ''
      continue
    }
    if (ch === '\r') continue
    if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }
    cell += ch
  }
  row.push(cell)
  rows.push(row)

  const headers = rows[0]?.map((h) => h.trim()) ?? []
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim() !== ''))

  const objects: Record<string, string>[] = []
  for (const r of dataRows) {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim()
    })
    objects.push(obj)
  }

  return { headers, rows: objects }
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
