import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { School } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login(email, password)
      if (user.role === 'SUPER_ADMIN') navigate('/platform/schools')
      else if (user.role === 'PARENT') navigate('/parent')
      else if ((user.levels || []).length > 1) navigate('/select-level')
      else navigate('/app')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-line bg-paper shadow-xl md:grid-cols-2">
        <div className="bg-gradient-to-br from-ink via-ink-soft to-forest p-10 text-white">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <School />
          </div>
          <h1 className="text-3xl font-semibold leading-tight">School Report System</h1>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            Where every child’s progress finds a clear voice — from nursery milestones to primary achievement.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-white/70">
            A calm, trusted space for teachers to record learning, for leaders to affirm results, and for families to celebrate growth — term after term, with reports that honour the journey of each learner.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col justify-center p-10">
          <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
          <label className="mt-8 text-sm font-medium">Email</label>
          <input
            className="mt-1 rounded-xl border border-line bg-sand px-4 py-3 outline-none focus:border-forest"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <label className="mt-4 text-sm font-medium">Password</label>
          <input
            className="mt-1 rounded-xl border border-line bg-sand px-4 py-3 outline-none focus:border-forest"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            disabled={busy}
            className="mt-6 rounded-xl bg-forest px-4 py-3 font-semibold text-white hover:bg-forest-soft disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
