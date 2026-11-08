import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE = 10

export default function usePagination(items, pageSize = PAGE_SIZE) {
  const list = Array.isArray(items) ? items : []
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [total, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [list, page, pageSize])

  return {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems,
    startIndex: (page - 1) * pageSize,
    showPagination: total > pageSize,
  }
}
