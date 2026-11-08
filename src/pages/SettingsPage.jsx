import { useEffect, useState } from 'react'
import api from '../api/client'
import AuthImage from '../components/AuthImage'
import PaginationBar from '../components/PaginationBar'
import { useAuth } from '../auth/AuthContext'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function SettingsPage() {
  const { user } = useAuth()
  const { confirm, success, error } = useFeedback()
  const [school, setSchool] = useState(null)
  const [staff, setStaff] = useState([])
  const [classes, setClasses] = useState([])
  const classesPage = usePagination(classes)
  const staffPage = usePagination(staff)

  const load = async () => {
    const s = await api.get('/schools/me')
    setSchool(s.data)
    const st = await api.get('/staff', { params: { role: 'TEACHER' } })
    setStaff(st.data)
    const years = await api.get('/years')
    const current = years.data.find((y) => y.currentYear) || years.data[0]
    if (current) {
      const c = await api.get('/classes', { params: { yearId: current.id } })
      setClasses(c.data)
    }
  }

  useEffect(() => { load() }, [])

  const upload = async (type, file, teacherId) => {
    const ok = await confirm({
      title: 'Upload file',
      message: teacherId ? 'Upload / replace this teacher signature?' : `Upload / replace school ${type}?`,
    })
    if (!ok) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (teacherId) {
        await api.post(`/users/${teacherId}/signature`, fd)
      } else {
        await api.post(`/schools/${school.id}/assets`, fd, { params: { type } })
      }
      success('Uploaded successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Upload failed')
    }
  }

  const setClassTeacher = async (clazz, teacherId) => {
    const teacher = staff.find((t) => String(t.id) === String(teacherId))
    const ok = await confirm({
      title: 'Class teacher',
      message: teacherId
        ? `Set “${teacher?.fullName || 'this teacher'}” as class teacher of ${clazz.name}?`
        : `Remove the class teacher from ${clazz.name}?`,
    })
    if (!ok) return
    try {
      await api.put(`/classes/${clazz.id}`, { classTeacherId: teacherId ? Number(teacherId) : null })
      success('Class teacher updated')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not update class teacher')
    }
  }

  if (!school) return <p>Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold">Signatures & school assets</h1>
      <p className="text-ink/60">Head teacher manages stamp, own signature, and teacher signatures used on report cards.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { type: 'logo', label: 'School logo', path: school.logoPath },
          { type: 'stamp', label: 'School stamp', path: school.stampPath },
          { type: 'headSignature', label: 'Head teacher signature', path: school.headSignaturePath },
        ].map((item) => (
          <div key={item.type} className="rounded-2xl border border-line bg-paper p-4">
            <h3 className="font-semibold">{item.label}</h3>
            <div className="mt-3 flex h-24 items-center justify-center rounded-xl bg-sand">
              {item.path ? <AuthImage path={item.path} alt="" className="max-h-20" /> : <span className="text-sm text-ink/40">Not set</span>}
            </div>
            <label className="mt-3 inline-block cursor-pointer rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(item.type, e.target.files[0])} />
            </label>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Class teachers</h2>
      <p className="text-sm text-ink/60">Each class has one class teacher. Their signature is printed on that class’s report cards.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {classesPage.pageItems.map((clazz) => (
          <div key={clazz.id} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest">{clazz.level}</p>
            <h3 className="font-semibold">{clazz.name}</h3>
            <select
              className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm"
              value={clazz.classTeacher?.id || ''}
              onChange={(e) => setClassTeacher(clazz, e.target.value)}
            >
              <option value="">Class teacher…</option>
              {staff.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            {clazz.classTeacher && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{clazz.classTeacher.fullName}</p>
                  {clazz.classTeacher.signaturePath
                    ? <AuthImage path={clazz.classTeacher.signaturePath} alt="" className="mt-2 h-8" />
                    : <p className="mt-1 text-xs text-ink/40">No signature yet</p>}
                </div>
                <label className="cursor-pointer shrink-0 rounded-lg bg-sand px-3 py-2 text-xs font-semibold">
                  Upload signature
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(null, e.target.files[0], clazz.classTeacher.id)} />
                </label>
              </div>
            )}
          </div>
        ))}
        {classes.length === 0 && <p className="text-sm text-ink/60">No classes for the current year.</p>}
      </div>
      <PaginationBar
        page={classesPage.page}
        totalPages={classesPage.totalPages}
        total={classesPage.total}
        pageSize={classesPage.pageSize}
        onPageChange={classesPage.setPage}
      />

      <h2 className="mt-8 text-lg font-semibold">Teacher signatures</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {staffPage.pageItems.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4">
            <div className="min-w-0">
              <p className="font-medium truncate">{t.fullName}</p>
              <p className="text-xs text-ink/50 truncate">{t.email}</p>
              {t.signaturePath && <AuthImage path={t.signaturePath} alt="" className="mt-2 h-8" />}
            </div>
            <label className="cursor-pointer shrink-0 rounded-lg bg-sand px-3 py-2 text-xs font-semibold">
              Upload signature
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(null, e.target.files[0], t.id)} />
            </label>
          </div>
        ))}
      </div>
      <PaginationBar
        page={staffPage.page}
        totalPages={staffPage.totalPages}
        total={staffPage.total}
        pageSize={staffPage.pageSize}
        onPageChange={staffPage.setPage}
      />

      <div className="mt-8 rounded-2xl border border-line bg-paper p-4">
        <h2 className="font-semibold">School details</h2>
        <p className="mt-2 text-sm">Head teacher name: {school.headTeacherName || user?.fullName}</p>
        <p className="text-sm">Phone: {school.phone}</p>
        <p className="text-sm">Email: {school.email}</p>
      </div>
    </div>
  )
}
