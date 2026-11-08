import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function DashboardPage() {
  const { selectedLevel, user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard', { params: { level: selectedLevel || undefined } })
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
  }, [selectedLevel])

  const cards = [
    { label: 'Students', value: stats?.students ?? '—', to: '/app/people' },
    { label: 'Classes', value: stats?.classes ?? '—', to: '/app/classes' },
    ...(user?.role === 'TEACHER' ? [] : [{ label: 'Staff', value: stats?.staff ?? '—', to: '/app/people' }]),
    { label: 'Unread notices', value: stats?.unreadNotifications ?? 0, to: '/app/notifications' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold">Good day, {user?.fullName?.split(' ')[0]}</h1>
      <p className="mt-1 text-ink/60">
        {selectedLevel ? `${selectedLevel} workspace overview` : 'School overview'}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-2xl border border-line bg-paper p-5 shadow-sm hover:border-forest">
            <p className="text-sm text-ink/60">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickLink to="/app/marks" title="Enter marks" desc="Class grid or Excel upload" />
        <QuickLink to="/app/reports" title="Review reports" desc="Approve and release to parents" />
        <QuickLink to="/app/classes" title="Manage classes" desc="Roster, subjects, and teachers" />
      </div>
    </div>
  )
}

function QuickLink({ to, title, desc }) {
  return (
    <Link to={to} className="rounded-2xl bg-ink p-5 text-white shadow-sm hover:bg-ink-soft">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/70">{desc}</p>
    </Link>
  )
}
