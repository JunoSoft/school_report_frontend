import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import NurseryReportCard from '../components/reports/NurseryReportCard'
import PrimaryReportCard from '../components/reports/PrimaryReportCard'

/** Above this, browser print can feel heavy — warn and leave room for a future PDF endpoint. */
const HEAVY_THRESHOLD = 40
const LOAD_CONCURRENCY = 5

async function mapPool(items, limit, mapper) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await mapper(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

export default function ReportBatchPrintPage() {
  const [params] = useSearchParams()
  const yearId = params.get('yearId')
  const classId = params.get('classId')
  const studentIds = useMemo(
    () => (params.get('studentIds') || '').split(',').map((s) => s.trim()).filter(Boolean),
    [params]
  )
  const [reports, setReports] = useState([])
  const [failed, setFailed] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const heavy = studentIds.length >= HEAVY_THRESHOLD

  useEffect(() => {
    if (!yearId || studentIds.length === 0) {
      setError('No students selected for printing.')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      setProgress(0)
      let done = 0
      const fails = []
      try {
        const loaded = await mapPool(studentIds, LOAD_CONCURRENCY, async (id) => {
          try {
            const { data } = await api.get(`/reports/student/${id}`, { params: { yearId } })
            return data
          } catch {
            fails.push(id)
            return null
          } finally {
            done += 1
            if (!cancelled) setProgress(done)
          }
        })
        if (cancelled) return
        setReports(loaded.filter(Boolean))
        setFailed(fails)
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load reports')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [yearId, studentIds])

  const printNow = () => {
    // Future: if (heavy) call POST /reports/class/{id}/pdf and download blob instead.
    window.print()
  }

  if (!yearId || studentIds.length === 0) {
    return (
      <div>
        <p className="text-red-600">{error || 'Nothing to print.'}</p>
        <Link to="/app/reports" className="mt-3 inline-block text-sm text-forest underline">Back to reports</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Print reports</h1>
          <p className="text-sm text-ink/60">
            {studentIds.length} student{studentIds.length === 1 ? '' : 's'}
            {classId ? ` · class #${classId}` : ''}
            {heavy ? ` · large batch (≥${HEAVY_THRESHOLD}): print may take a moment` : ''}
          </p>
          {loading && (
            <p className="mt-1 text-sm text-ink/60">Loading {progress}/{studentIds.length}…</p>
          )}
          {!loading && failed.length > 0 && (
            <p className="mt-1 text-sm text-amber-700">{failed.length} report(s) could not load and were skipped.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/reports${classId ? `?classId=${classId}` : ''}`} className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-medium">
            Back
          </Link>
          <button
            type="button"
            disabled={loading || reports.length === 0}
            onClick={printNow}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Print {reports.length || ''} {reports.length === 1 ? 'report' : 'reports'}
          </button>
        </div>
      </div>

      {error && <p className="no-print mb-4 text-red-600">{error}</p>}
      {loading && <p className="no-print">Preparing cards…</p>}

      <div className="batch-print-stack space-y-8">
        {reports.map((data) => (
          <div key={data.student?.id || data.reportId} className="print-page break-after-page">
            {data.type === 'NURSERY'
              ? <NurseryReportCard data={data} />
              : <PrimaryReportCard data={data} />}
          </div>
        ))}
      </div>
    </div>
  )
}
