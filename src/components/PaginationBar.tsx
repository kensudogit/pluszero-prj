import { PAGE_SIZE_OPTIONS, clampPage, totalPages } from '../lib/pagination'
import { interpolate } from '../locales/interpolate'
import { ja } from '../locales'

export type PaginationBarProps = {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const j = ja.pagination
  const tp = totalPages(total, pageSize)
  const safePage = clampPage(page, total, pageSize)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(total, safePage * pageSize)

  return (
    <div className="pagination-bar card">
      <p className="pagination-range muted">
        {total === 0
          ? j.empty
          : interpolate(j.range, { from, to, total })
        }
      </p>
      <div className="pagination-controls">
        <label className="field compact pagination-page-size">
          <span>{j.perPage}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn secondary"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          {j.prev}
        </button>
        <span className="pagination-page-num muted">
          {interpolate(j.pageStatus, { page: safePage, totalPages: tp })}
        </span>
        <button
          type="button"
          className="btn secondary"
          disabled={safePage >= tp}
          onClick={() => onPageChange(safePage + 1)}
        >
          {j.next}
        </button>
      </div>
    </div>
  )
}
