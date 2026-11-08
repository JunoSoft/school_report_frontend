import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, GraduationCap, LogOut, School } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useEffect, useState } from 'react'
import api from '../api/client'
import AuthImage from './AuthImage'

const roleNav = {
  SUPER_ADMIN: [
    { to: '/platform/schools', label: 'Schools' },
    { to: '/platform/templates', label: 'Templates' },
  ],
  SCHOOL_ADMIN: [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/people', label: 'People' },
    { to: '/app/classes', label: 'Classes' },
    { to: '/app/marks', label: 'Marks' },
    { to: '/app/reports', label: 'Reports' },
    { to: '/app/settings', label: 'Settings' },
  ],
  DIRECTOR: [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/people', label: 'People' },
    { to: '/app/classes', label: 'Classes' },
    { to: '/app/marks', label: 'Marks' },
    { to: '/app/reports', label: 'Reports' },
    { to: '/app/settings', label: 'Settings' },
  ],
  HEAD_TEACHER: [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/people', label: 'People' },
    { to: '/app/classes', label: 'Classes' },
    { to: '/app/marks', label: 'Marks' },
    { to: '/app/reports', label: 'Reports' },
    { to: '/app/settings', label: 'Signatures' },
  ],
  SECRETARY: [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/people', label: 'People' },
    { to: '/app/classes', label: 'Classes' },
  ],
  TEACHER: [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/classes', label: 'My classes' },
    { to: '/app/marks', label: 'Marks' },
    { to: '/app/reports', label: 'Reports' },
  ],
  PARENT: [
    { to: '/parent', label: 'My reports' },
  ],
  ACCOUNTANT: [
    { to: '/app', label: 'Dashboard' },
    { to: '/app/fees', label: 'Fees' },
  ],
}

export default function AppShell() {
  const { user, logout, selectedLevel, setSelectedLevel } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const links = roleNav[user?.role] || []
  const levels = user?.levels || []

  useEffect(() => {
    if (!user || user.role === 'SUPER_ADMIN') return
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.count)).catch(() => {})
  }, [user])

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {user?.school?.logoPath ? (
              <AuthImage path={user.school.logoPath} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                <School size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-ink">{user?.school?.name || 'Report Platform'}</p>
              <p className="text-xs text-ink/60">{user?.fullName} · {user?.role?.replaceAll('_', ' ')}</p>
            </div>
          </div>

          {levels.length > 1 && (
            <div className="ml-4 flex rounded-full bg-sand p-1">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selectedLevel === level ? 'bg-forest text-white shadow' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  {level === 'NURSERY' ? 'Nursery' : 'Primary'}
                </button>
              ))}
            </div>
          )}

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/app' || link.to === '/parent'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-ink text-white' : 'text-ink/70 hover:bg-sand'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="relative rounded-lg p-2 text-ink/70 hover:bg-sand"
            onClick={() => navigate('/app/notifications')}
            title="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{unread}</span>
            )}
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="rounded-lg p-2 text-ink/70 hover:bg-sand"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${isActive ? 'bg-ink text-white' : 'bg-sand text-ink/70'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {selectedLevel && user?.role !== 'SUPER_ADMIN' && user?.role !== 'PARENT' && (
          <div className="no-print mb-4 flex items-center gap-2 text-sm text-ink/60">
            <GraduationCap size={16} className="text-forest" />
            Working in <span className="font-semibold text-ink">{selectedLevel === 'NURSERY' ? 'Nursery' : 'Primary'}</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}
