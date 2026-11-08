import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

export default function VerifyPage() {
  const { code } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/public/verify/${code}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Invalid code'))
  }, [code])

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <div className="w-full rounded-3xl border border-line bg-paper p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">Report verification</h1>
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {data && (
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="text-ink/60">School:</span> {data.school}</p>
            <p><span className="text-ink/60">Student:</span> {data.studentName}</p>
            <p><span className="text-ink/60">ID:</span> {data.uniqueId}</p>
            <p><span className="text-ink/60">Year:</span> {data.year}</p>
            <p><span className="text-ink/60">Class:</span> {data.className}</p>
            <p><span className="text-ink/60">Status:</span> {data.status}</p>
            <p><span className="text-ink/60">Decision:</span> {data.decision || '—'}</p>
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">This report card is genuine.</p>
          </div>
        )}
      </div>
    </div>
  )
}
