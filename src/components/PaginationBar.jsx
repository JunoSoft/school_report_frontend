export default function PaginationBar({ page, totalPages, total, pageSize, onPageChange, className = '' }) {
  if (!total || total <= pageSize) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 text-sm ${className}`}>
      <p className="text-ink/60">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-line bg-paper px-3 py-1.5 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="min-w-20 text-center font-medium text-ink">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="rounded-lg border border-line bg-paper px-3 py-1.5 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
