import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import { useAuth } from '../auth/AuthContext'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function ReportsPage() {
  const { selectedLevel, user } = useAuth()
  const { confirm, success, error } = useFeedback()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState(params.get('classId') || '')
  const [board, setBoard] = useState([])
  const [years, setYears] = useState([])
  const [selected, setSelected] = useState(() => new Set())
  const canApprove = ['HEAD_TEACHER', 'DIRECTOR', 'SCHOOL_ADMIN'].includes(user?.role)

  useEffect(() => {
    ;(async () => {
      const y = await api.get('/years')
      setYears(y.data)
      const current = y.data.find((x) => x.currentYear) || y.data[0]
      if (!current) return
      const c = await api.get('/classes', { params: { yearId: current.id, level: selectedLevel || undefined } })
      setClasses(c.data)
      const id = classId || String(c.data[0]?.id || '')
      setClassId(id)
    })()
  }, [selectedLevel])

  useEffect(() => {
    if (!classId) return
    api.get(`/reports/class/${classId}/board`).then((r) => {
      setBoard(r.data)
      setSelected(new Set())
    })
  }, [classId])

  const submit = async () => {
    const ok = await confirm({
      title: 'Submit class reports',
      message: 'Submit all reports in this class for approval?',
    })
    if (!ok) return
    try {
      await api.post(`/reports/class/${classId}/submit`)
      const r = await api.get(`/reports/class/${classId}/board`)
      setBoard(r.data)
      success('Class reports submitted successfully')
    } catch (err) {
      error(err.response?.data?.message || 'Could not submit reports')
    }
  }

  const approveAll = async () => {
    const ok = await confirm({
      title: 'Approve all reports',
      message: 'Approve every submitted report in this class? Parents will be able to view them.',
      confirmLabel: 'Approve all',
    })
    if (!ok) return
    try {
      await api.post(`/reports/class/${classId}/approve`)
      const r = await api.get(`/reports/class/${classId}/board`)
      setBoard(r.data)
      success('All reports approved successfully')
    } catch (err) {
      error(err.response?.data?.message || 'Could not approve reports')
    }
  }

  const approveOne = async (reportId) => {
    const ok = await confirm({
      title: 'Approve report',
      message: 'Approve this student’s report?',
      confirmLabel: 'Approve',
    })
    if (!ok) return
    try {
      await api.post(`/reports/${reportId}/approve`, {})
      const r = await api.get(`/reports/class/${classId}/board`)
      setBoard(r.data)
      success('Report approved successfully')
    } catch (err) {
      error(err.response?.data?.message || 'Could not approve report')
    }
  }

  const yearId = years.find((y) => y.currentYear)?.id || years[0]?.id
  const allIds = useMemo(() => board.map((r) => String(r.studentId)), [board])
  const boardPage = usePagination(board)
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id))

  const toggleOne = (studentId) => {
    const id = String(studentId)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  const goPrint = (ids) => {
    if (!yearId || !ids.length) return
    const qs = new URLSearchParams({
      yearId: String(yearId),
      classId: String(classId),
      studentIds: ids.join(','),
    })
    navigate(`/app/reports/print?${qs}`)
  }

  const printClass = () => goPrint(allIds)
  const printSelected = () => goPrint([...selected])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reports board</h1>
          <p className="text-ink/60">Submit, approve, preview one, or print the class / a selection</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-xl border border-line px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={submit} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">Submit class</button>
          {canApprove && (
            <button onClick={approveAll} className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white">Approve all</button>
          )}
          <button
            type="button"
            onClick={printClass}
            disabled={!board.length}
            className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Print class
          </button>
          <button
            type="button"
            onClick={printSelected}
            disabled={selected.size === 0}
            className="rounded-xl border border-line bg-sand px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Print selected ({selected.size})
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-sand text-left">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Missing marks</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boardPage.pageItems.map((row) => (
              <tr key={row.studentId} className="border-t border-line">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(String(row.studentId))}
                    onChange={() => toggleOne(row.studentId)}
                    aria-label={`Select ${row.fullName}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{row.fullName}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    row.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>{row.status}</span>
                </td>
                <td className="px-4 py-3">{row.missingMarks}</td>
                <td className="px-4 py-3">{row.decision || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="rounded-lg bg-sand px-3 py-1.5 text-xs font-medium" to={`/app/reports/preview/${row.studentId}?yearId=${yearId}`}>
                      Preview / print one
                    </Link>
                    {canApprove && row.reportId && row.status !== 'APPROVED' && (
                      <button onClick={() => approveOne(row.reportId)} className="rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-white">
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="border-t border-line px-4 py-2">
          <PaginationBar
            page={boardPage.page}
            totalPages={boardPage.totalPages}
            total={boardPage.total}
            pageSize={boardPage.pageSize}
            onPageChange={boardPage.setPage}
          />
        </div>
      </div>
    </div>
  )
}
