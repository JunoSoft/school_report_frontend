import { useEffect, useState } from 'react'
import api from '../api/client'
import AuthImage from '../components/AuthImage'
import PaginationBar from '../components/PaginationBar'
import { useAuth } from '../auth/AuthContext'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

function staffLevelValue(levels) {
  const parts = (Array.isArray(levels) ? levels : String(levels || '').split(','))
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
  const nursery = parts.includes('NURSERY')
  const primary = parts.includes('PRIMARY')
  if (nursery && primary) return 'NURSERY,PRIMARY'
  if (primary) return 'PRIMARY'
  return 'NURSERY'
}

function staffLevelLabels(levels) {
  const value = staffLevelValue(levels)
  if (value === 'NURSERY,PRIMARY') return ['Nursery', 'Primary']
  if (value === 'PRIMARY') return ['Primary']
  return ['Nursery']
}

function roleLabel(role) {
  return String(role || '')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function PeoplePage() {
  const { user, selectedLevel } = useAuth()
  const { confirm, success, error } = useFeedback()
  const [tab, setTab] = useState('students')
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [classes, setClasses] = useState([])
  const [photo, setPhoto] = useState(null)
  const [classFilter, setClassFilter] = useState('')
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    uniqueId: '',
    sex: 'F',
    dateOfBirth: '',
    classId: '',
    email: '',
    fullName: '',
    role: 'TEACHER',
    levels: 'NURSERY,PRIMARY',
  })
  const canManageStaff = ['SCHOOL_ADMIN', 'DIRECTOR'].includes(user?.role)
  const canViewStaff = user?.role !== 'TEACHER'
  const canRegisterStudent = ['SCHOOL_ADMIN', 'DIRECTOR', 'SECRETARY', 'HEAD_TEACHER', 'TEACHER'].includes(user?.role)

  const load = async () => {
    const requests = [api.get('/students'), api.get('/years')]
    if (canViewStaff) requests.splice(1, 0, api.get('/staff'))
    const results = await Promise.all(requests)
    setStudents(results[0].data)
    const y = canViewStaff ? results[2] : results[1]
    setStaff(canViewStaff ? results[1].data : [])
    const current = y.data.find((x) => x.currentYear) || y.data[0]
    if (current) {
      const c = await api.get('/classes', { params: { yearId: current.id } })
      setClasses(c.data)
    }
  }

  useEffect(() => { load() }, [selectedLevel])

  const createStudent = async (e) => {
    e.preventDefault()
    const ok = await confirm({
      title: editingStudentId ? 'Update student' : 'Register student',
      message: editingStudentId
        ? `Save changes for “${form.firstName} ${form.lastName}”?`
        : `Save student “${form.firstName} ${form.lastName}”?`,
    })
    if (!ok) return
    try {
      const body = {
        uniqueId: form.uniqueId,
        firstName: form.firstName,
        lastName: form.lastName,
        sex: form.sex,
        dateOfBirth: form.dateOfBirth || null,
        classId: form.classId ? Number(form.classId) : null,
      }
      const { data } = editingStudentId
        ? await api.put(`/students/${editingStudentId}`, body)
        : await api.post('/students', body)
      if (photo) {
        const fd = new FormData()
        fd.append('file', photo)
        await api.post(`/students/${data.id}/photo`, fd)
      }
      const updated = Boolean(editingStudentId)
      setForm((f) => ({ ...f, firstName: '', lastName: '', uniqueId: '', dateOfBirth: '', classId: '' }))
      setPhoto(null)
      setEditingStudentId(null)
      success(updated ? 'Student updated successfully' : 'Student registered successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not save student')
    }
  }

  const startEditStudent = (s) => {
    setEditingStudentId(s.id)
    setForm((f) => ({
      ...f,
      uniqueId: s.uniqueId || '',
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      sex: s.sex || 'F',
      dateOfBirth: s.dateOfBirth || '',
      classId: s.classId ? String(s.classId) : '',
    }))
  }

  const downloadStudentTemplate = async () => {
    try {
      const res = await api.get('/students/import/template', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'student-registration-template.xlsx'
      a.click()
    } catch (err) {
      error(err.response?.data?.message || 'Could not download the template')
    }
  }

  const importStudents = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = await confirm({
      title: 'Import students',
      message: 'Register pupils from this Excel file? Use the downloaded template. Existing student IDs are skipped. Photos are uploaded afterwards, one pupil at a time.',
    })
    e.target.value = ''
    if (!ok) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/students/import', fd, {
        params: selectedLevel ? { level: selectedLevel } : undefined,
      })
      const warn = (data.warnings || []).slice(0, 4).join(' ')
      success(`Registered ${data.created} student(s). Skipped ${data.skipped}.${warn ? ' ' + warn : ''}`)
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not import students')
    }
  }

  const uploadPhoto = async (studentId, file) => {
    if (!file) return
    const ok = await confirm({ title: 'Upload photo', message: 'Replace this student’s passport photo?' })
    if (!ok) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/students/${studentId}/photo`, fd)
      success('Photo uploaded successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not upload photo')
    }
  }

  const createStaff = async (e) => {
    e.preventDefault()
    const ok = await confirm({
      title: editingStaffId ? 'Update staff' : 'Register staff',
      message: editingStaffId
        ? `Save changes for “${form.fullName}”?`
        : `Create account for “${form.fullName}” as ${form.role}?`,
    })
    if (!ok) return
    try {
      const body = {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        levels: form.levels,
      }
      const updated = Boolean(editingStaffId)
      if (editingStaffId) await api.put(`/staff/${editingStaffId}`, body)
      else await api.post('/staff', body)
      setEditingStaffId(null)
      setForm((f) => ({ ...f, fullName: '', email: '' }))
      success(updated ? 'Staff updated successfully' : 'Staff registered successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not save staff')
    }
  }

  const startEditStaff = (u) => {
    setEditingStaffId(u.id)
    setForm((f) => ({
      ...f,
      fullName: u.fullName || '',
      email: u.email || '',
      role: u.role || 'TEACHER',
      levels: staffLevelValue(u.levels),
    }))
  }

  const visibleStudents = students.filter((s) => {
    if (!classFilter) return true
    if (classFilter === 'none') return !s.classId
    return String(s.classId || '') === classFilter
  })
  const studentsPage = usePagination(visibleStudents)
  const staffPage = usePagination(staff)

  return (
    <div>
      <h1 className="text-2xl font-semibold">People</h1>
      {canViewStaff && (
        <div className="mt-4 flex gap-2">
          {['students', 'staff'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === t ? 'bg-ink text-white' : 'bg-sand'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'students' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          {canRegisterStudent && (
          <div className="space-y-4">
            <form onSubmit={createStudent} className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">{editingStudentId ? 'Edit student' : 'Register student'}</h2>
              {['uniqueId', 'firstName', 'lastName'].map((k) => (
                <input key={k} className="mt-3 w-full rounded-xl border border-line px-3 py-2" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
              ))}
              <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
              <label className="mt-3 block text-xs text-ink/60">Date of birth</label>
              <input type="date" className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              <label className="mt-3 block text-xs text-ink/60">Class</label>
              <select className="mt-1 w-full rounded-xl border border-line px-3 py-2" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="mt-3 block text-xs text-ink/60">Passport photo</label>
              <input type="file" accept="image/*" className="mt-1 w-full text-sm" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              <button className="mt-4 w-full rounded-xl bg-forest py-2 font-medium text-white">
                {editingStudentId ? 'Update student' : 'Save student'}
              </button>
              {editingStudentId && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl border border-line py-2 text-sm"
                  onClick={() => {
                    setEditingStudentId(null)
                    setForm((f) => ({ ...f, firstName: '', lastName: '', uniqueId: '', dateOfBirth: '', classId: '' }))
                  }}
                >
                  Cancel edit
                </button>
              )}
            </form>
            <div className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">Register from Excel</h2>
              <p className="mt-2 text-xs text-ink/60">
                Download the template and keep its column names. Required columns are student ID, first name, and last name. Class is optional and must match a current class name. Add passport photos after import.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={downloadStudentTemplate} className="rounded-xl border border-line px-3 py-2 text-sm font-medium">
                  Download template
                </button>
                <label className="cursor-pointer rounded-xl bg-sand px-3 py-2 text-sm font-medium">
                  Upload Excel
                  <input type="file" accept=".xlsx" className="hidden" onChange={importStudents} />
                </label>
              </div>
            </div>
          </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="font-semibold">Students</h2>
              <select className="rounded-xl border border-line px-3 py-2 text-sm" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="none">No class yet</option>
              </select>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-sand text-left">
                <tr>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Sex</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsPage.pageItems.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      {s.photoPath ? (
                        <AuthImage path={s.photoPath} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{s.uniqueId}</td>
                    <td className="px-4 py-3 font-medium">{s.fullName}</td>
                    <td className="px-4 py-3">{s.className || '—'}</td>
                    <td className="px-4 py-3">{s.sex}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="rounded-lg bg-sand px-2 py-1 text-xs font-medium" onClick={() => startEditStudent(s)}>Edit</button>
                        <input type="file" accept="image/*" className="text-xs" onChange={(e) => uploadPhoto(s.id, e.target.files?.[0])} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="border-t border-line px-4 py-2">
              <PaginationBar
                page={studentsPage.page}
                totalPages={studentsPage.totalPages}
                total={studentsPage.total}
                pageSize={studentsPage.pageSize}
                onPageChange={studentsPage.setPage}
              />
            </div>
          </div>
        </div>
      )}

      {canViewStaff && tab === 'staff' && (
        <div className={`mt-6 grid gap-6 ${canManageStaff ? 'lg:grid-cols-[320px_1fr]' : ''}`}>
          {canManageStaff && (
            <form onSubmit={createStaff} className="rounded-2xl border border-line bg-paper p-4 h-fit">
              <h2 className="font-semibold">{editingStaffId ? 'Edit staff' : 'Register staff'}</h2>
              <input className="mt-3 w-full rounded-xl border border-line px-3 py-2" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              <input className="mt-3 w-full rounded-xl border border-line px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {['TEACHER', 'SECRETARY', 'HEAD_TEACHER', 'DIRECTOR', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT'].map((r) => (
                  <option key={r} value={r}>{roleLabel(r)}</option>
                ))}
              </select>
              <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={staffLevelValue(form.levels)} onChange={(e) => setForm({ ...form, levels: e.target.value })}>
                <option value="NURSERY,PRIMARY">Nursery and Primary</option>
                <option value="NURSERY">Nursery</option>
                <option value="PRIMARY">Primary</option>
              </select>
              <button className="mt-4 w-full rounded-xl bg-forest py-2 font-medium text-white">
                {editingStaffId ? 'Update staff' : 'Save staff'}
              </button>
              {editingStaffId && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl border border-line py-2 text-sm"
                  onClick={() => {
                    setEditingStaffId(null)
                    setForm((f) => ({ ...f, fullName: '', email: '' }))
                  }}
                >
                  Cancel edit
                </button>
              )}
            </form>
          )}
          <div className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-semibold">Registered staff</h2>
              <p className="text-sm text-ink/60">{staff.length} member{staff.length === 1 ? '' : 's'} in this school</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-sand text-left">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Levels</th>
                    {canManageStaff && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {staffPage.pageItems.map((u) => (
                    <tr key={u.id} className="border-t border-line">
                      <td className="px-4 py-3 font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 text-ink/70">{u.email}</td>
                      <td className="px-4 py-3">{roleLabel(u.role)}</td>
                      <td className="px-4 py-3">{staffLevelLabels(u.levels).join(', ')}</td>
                      {canManageStaff && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-lg bg-sand px-2 py-1 text-xs font-medium"
                            onClick={() => startEditStaff(u)}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-2">
              <PaginationBar
                page={staffPage.page}
                totalPages={staffPage.totalPages}
                total={staffPage.total}
                pageSize={staffPage.pageSize}
                onPageChange={staffPage.setPage}
              />
            </div>
            {staff.length === 0 && (
              <div className="border-t border-dashed border-line px-4 py-10 text-center text-sm text-ink/60">
                No staff registered yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
