import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import usePagination from '../hooks/usePagination'

export default function ParentPage() {
  const [reports, setReports] = useState([])
  const [children, setChildren] = useState([])
  const childrenPage = usePagination(children)
  const reportsPage = usePagination(reports)

  useEffect(() => {
    api.get('/parent/reports').then((r) => setReports(r.data))
    api.get('/parents/me/children').then((r) => setChildren(r.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold">My children's reports</h1>
      <p className="mt-1 text-ink/60">Approved reports across all years. Opening a report notifies the head teacher.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {childrenPage.pageItems.map((c) => (
          <div key={c.id} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-sm text-ink/60">{c.uniqueId}</p>
            <h2 className="text-lg font-semibold truncate">{c.fullName}</h2>
          </div>
        ))}
      </div>
      <PaginationBar
        page={childrenPage.page}
        totalPages={childrenPage.totalPages}
        total={childrenPage.total}
        pageSize={childrenPage.pageSize}
        onPageChange={childrenPage.setPage}
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand text-left">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Seen</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reportsPage.pageItems.map((r) => (
                <tr key={r.reportId} className="border-t border-line">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{r.studentName}</td>
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3">{r.className}</td>
                  <td className="px-4 py-3">{r.decision || '—'}</td>
                  <td className="px-4 py-3">{r.acknowledgedAt ? 'Yes' : r.openedAt ? 'Opened' : 'No'}</td>
                  <td className="px-4 py-3">
                    <Link className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white" to={`/parent/reports/${r.studentId}?yearId=${r.yearId}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td className="px-4 py-6 text-ink/60" colSpan={6}>No approved reports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-2">
          <PaginationBar
            page={reportsPage.page}
            totalPages={reportsPage.totalPages}
            total={reportsPage.total}
            pageSize={reportsPage.pageSize}
            onPageChange={reportsPage.setPage}
          />
        </div>
      </div>
    </div>
  )
}
