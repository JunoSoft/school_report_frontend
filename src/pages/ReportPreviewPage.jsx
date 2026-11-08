import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import PrimaryReportCard from '../components/reports/PrimaryReportCard'
import NurseryReportCard from '../components/reports/NurseryReportCard'
import { useAuth } from '../auth/AuthContext'
import { useFeedback } from '../feedback/FeedbackContext'

export default function ReportPreviewPage() {
  const { studentId } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { confirm, success, error: toastError } = useFeedback()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const yearId = params.get('yearId')

  useEffect(() => {
    if (!yearId) return
    api.get(`/reports/student/${studentId}`, { params: { yearId } })
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load report'))
  }, [studentId, yearId])

  const acknowledge = async () => {
    if (!data?.reportId) return
    const ok = await confirm({
      title: 'Mark as seen',
      message: 'Confirm you have reviewed this report? The head teacher will be notified.',
      confirmLabel: 'Mark as seen',
    })
    if (!ok) return
    try {
      await api.post(`/parent/reports/${data.reportId}/acknowledge`, { feedback })
      success('Marked as seen. Head teacher has been notified.')
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not save acknowledgement')
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p>Loading report…</p>

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Report preview</h1>
          <p className="text-sm text-ink/60">{data.student.fullName} · {data.status}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
            Download / Print PDF
          </button>
        </div>
      </div>

      {user?.role === 'PARENT' && (
        <div className="no-print mb-4 rounded-2xl border border-line bg-paper p-4">
          <p className="text-sm text-ink/70">Opening this report notifies the head teacher. Confirm you have seen it and leave optional feedback.</p>
          <textarea
            className="mt-3 w-full rounded-xl border border-line px-3 py-2"
            rows={3}
            placeholder="Feedback / review"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button onClick={acknowledge} className="mt-3 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white">
            Mark as seen
          </button>
        </div>
      )}

      {data.type === 'NURSERY' ? <NurseryReportCard data={data} /> : <PrimaryReportCard data={data} />}
    </div>
  )
}
