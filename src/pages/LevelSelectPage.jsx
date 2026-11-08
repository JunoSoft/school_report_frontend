import { useNavigate } from 'react-router-dom'
import { Baby, BookOpen } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function LevelSelectPage() {
  const { user, setSelectedLevel } = useAuth()
  const navigate = useNavigate()
  const levels = user?.levels || []

  const choose = (level) => {
    setSelectedLevel(level)
    navigate('/app')
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-forest">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Where are you working today?</h1>
        <p className="mt-2 text-ink/60">You can switch Nursery and Primary any time from the top bar.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {levels.includes('NURSERY') && (
          <button
            onClick={() => choose('NURSERY')}
            className="group rounded-3xl border border-line bg-paper p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-forest hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Baby />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Nursery</h2>
            <p className="mt-2 text-ink/60">Color-band progress reports, life skills, and Excel mark sheets.</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-forest group-hover:underline">Continue →</span>
          </button>
        )}
        {levels.includes('PRIMARY') && (
          <button
            onClick={() => choose('PRIMARY')}
            className="group rounded-3xl border border-line bg-paper p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-ink hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <BookOpen />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Primary</h2>
            <p className="mt-2 text-ink/60">Official EU / ET report cards, ranks, decisions, and promotions.</p>
            <span className="mt-6 inline-flex text-sm font-semibold text-ink group-hover:underline">Continue →</span>
          </button>
        )}
      </div>
    </div>
  )
}
