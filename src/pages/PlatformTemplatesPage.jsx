import { useEffect, useState } from 'react'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import usePagination from '../hooks/usePagination'

export default function PlatformTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const page = usePagination(templates)

  useEffect(() => {
    api.get('/templates').then((r) => setTemplates(r.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Report templates</h1>
      <p className="text-ink/60">Named templates assigned to schools by level. New Light Academy nursery and primary are seeded.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {page.pageItems.map((t) => (
          <div key={t.id} className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest">{t.level}</p>
            <h2 className="mt-1 text-xl font-semibold truncate">{t.name}</h2>
            <p className="mt-2 text-sm text-ink/60">Version {t.version}</p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-sand p-3 text-[11px]">
              {typeof t.definitionJson === 'string' ? t.definitionJson : JSON.stringify(t.definitionJson, null, 2)}
            </pre>
          </div>
        ))}
      </div>
      <PaginationBar
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
        pageSize={page.pageSize}
        onPageChange={page.setPage}
      />
    </div>
  )
}
