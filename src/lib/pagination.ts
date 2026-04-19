/** Options for rows per page (cases / tasks / customers tables). */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export function totalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

/** Current page clamped to [1, totalPages]. */
export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const tp = totalPages(totalItems, pageSize)
  return Math.min(Math.max(1, page), tp)
}
