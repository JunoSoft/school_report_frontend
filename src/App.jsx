import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { FeedbackProvider } from './feedback/FeedbackContext'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import LevelSelectPage from './pages/LevelSelectPage'
import DashboardPage from './pages/DashboardPage'
import PeoplePage from './pages/PeoplePage'
import ClassesPage from './pages/ClassesPage'
import MarksPage from './pages/MarksPage'
import ReportsPage from './pages/ReportsPage'
import ReportPreviewPage from './pages/ReportPreviewPage'
import ReportBatchPrintPage from './pages/ReportBatchPrintPage'
import ParentPage from './pages/ParentPage'
import PlatformSchoolsPage from './pages/PlatformSchoolsPage'
import PlatformTemplatesPage from './pages/PlatformTemplatesPage'
import SettingsPage from './pages/SettingsPage'
import FeesPage from './pages/FeesPage'
import NotificationsPage from './pages/NotificationsPage'
import VerifyPage from './pages/VerifyPage'

function Protected({ children, roles, requireLevel }) {
  const { user, loading, selectedLevel, isSuperAdmin, isParent } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  if (requireLevel && !isSuperAdmin && !isParent) {
    const levels = user.levels || []
    if (levels.length > 1 && !selectedLevel) return <Navigate to="/select-level" replace />
  }
  return children
}

function HomeRedirect() {
  const { user, loading, selectedLevel } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/platform/schools" replace />
  if (user.role === 'PARENT') return <Navigate to="/parent" replace />
  if ((user.levels || []).length > 1 && !selectedLevel) return <Navigate to="/select-level" replace />
  return <Navigate to="/app" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <FeedbackProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:code" element={<VerifyPage />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/select-level" element={
          <Protected><LevelSelectPage /></Protected>
        } />

        <Route path="/platform" element={
          <Protected roles={['SUPER_ADMIN']}><AppShell /></Protected>
        }>
          <Route path="schools" element={<PlatformSchoolsPage />} />
          <Route path="templates" element={<PlatformTemplatesPage />} />
        </Route>

        <Route path="/app" element={
          <Protected requireLevel><AppShell /></Protected>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="marks" element={<MarksPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/preview/:studentId" element={<ReportPreviewPage />} />
          <Route path="reports/print" element={<ReportBatchPrintPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="/parent" element={
          <Protected roles={['PARENT']}><AppShell /></Protected>
        }>
          <Route index element={<ParentPage />} />
          <Route path="reports/:studentId" element={<ReportPreviewPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </FeedbackProvider>
    </AuthProvider>
  )
}
