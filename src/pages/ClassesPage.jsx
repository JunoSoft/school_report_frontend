import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import { useAuth } from '../auth/AuthContext'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function ClassesPage() {
  const { selectedLevel, user } = useAuth()
  const { confirm, success, error } = useFeedback()
  const [years, setYears] = useState([])
  const [yearId, setYearId] = useState(null)
  const [classes, setClasses] = useState([])
  const [yearClasses, setYearClasses] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [name, setName] = useState('')
  const [classTeacherId, setClassTeacherId] = useState('')
  const [fromClassId, setFromClassId] = useState('')
  const [placeStudentId, setPlaceStudentId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [assignClasses, setAssignClasses] = useState([])
  const [assignSubjects, setAssignSubjects] = useState([])
  const [mapTeacherId, setMapTeacherId] = useState('')
  const [mapRows, setMapRows] = useState([])
  const [mapClassId, setMapClassId] = useState('')
  const [addClassId, setAddClassId] = useState('')
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', nurseryCategory: '', maxEu: '', maxEt: '', maxTotal: '' })
  const [editSubjectId, setEditSubjectId] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [classSubjects, setClassSubjects] = useState([])
  const [addSubjectId, setAddSubjectId] = useState('')
  const [listClass, setListClass] = useState(null)
  const [printAllRoster, setPrintAllRoster] = useState(false)

  const canManage = ['SCHOOL_ADMIN', 'DIRECTOR', 'HEAD_TEACHER'].includes(user?.role)
  const level = selectedLevel || 'PRIMARY'

  const load = async () => {
    const y = await api.get('/years')
    setYears(y.data)
    const current = y.data.find((x) => x.currentYear) || y.data[0]
    const id = current?.id
    setYearId(id)
    if (id) {
      const [c, all] = await Promise.all([
        api.get('/classes', { params: { yearId: id, level: selectedLevel || undefined } }),
        api.get('/classes', { params: { yearId: id } }),
      ])
      setClasses(c.data)
      setYearClasses(all.data)
      if (canManage) {
        const [nursery, primary] = await Promise.all([
          api.get('/subjects', { params: { level: 'NURSERY' } }),
          api.get('/subjects', { params: { level: 'PRIMARY' } }),
        ])
        setAssignClasses(all.data)
        setAssignSubjects([...(nursery.data || []), ...(primary.data || [])])
      }
    }
    const [s, t, sub] = await Promise.all([
      api.get('/students'),
      api.get('/staff', { params: { role: 'TEACHER' } }),
      api.get('/subjects', { params: { level } }),
    ])
    setStudents(s.data)
    setTeachers(t.data)
    setSubjects(sub.data)
  }

  useEffect(() => { load() }, [selectedLevel])

  const loadClassSubjects = async (classId) => {
    if (!classId) {
      setClassSubjects([])
      return
    }
    const { data } = await api.get(`/classes/${classId}/subjects`)
    setClassSubjects(data)
  }

  useEffect(() => {
    loadClassSubjects(selectedClassId)
  }, [selectedClassId])

  const createClass = async (e) => {
    e.preventDefault()
    const ok = await confirm({ title: 'Create class', message: `Create class “${name}”?` })
    if (!ok) return
    try {
      await api.post('/classes', {
        academicYearId: yearId,
        level,
        name,
        combination: level,
        classTeacherId: classTeacherId ? Number(classTeacherId) : null,
      })
      setName('')
      setClassTeacherId('')
      success('Class created successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not create class')
    }
  }

  const updateClassTeacher = async (classId, teacherId) => {
    const ok = await confirm({ title: 'Update class teacher', message: 'Change the class teacher for this class?' })
    if (!ok) return
    try {
      await api.put(`/classes/${classId}`, { classTeacherId: teacherId ? Number(teacherId) : null })
      success('Class teacher updated')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not update class teacher')
    }
  }

  const fromStudents = students
    .filter((s) => fromClassId && String(s.classId || '') === String(fromClassId))
    .slice()
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))

  const placeStudent = async (e) => {
    e.preventDefault()
    const pupil = fromStudents.find((s) => String(s.id) === String(placeStudentId))
    const dest = yearClasses.find((c) => String(c.id) === String(toClassId))
    if (!pupil || !dest) return
    const ok = await confirm({
      title: 'Place student',
      message: `Place “${pupil.fullName}” in ${dest.name}?`,
    })
    if (!ok) return
    try {
      await api.post('/enrollments', { studentId: Number(placeStudentId), classId: Number(toClassId) })
      setPlaceStudentId('')
      setToClassId('')
      success('Student placed in class')
      await load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not place student')
    }
  }

  const applyAssignmentRows = (rows) => {
    const next = (rows || []).map((row) => ({
      classId: Number(row.classId),
      classTeacher: Boolean(row.classTeacher),
      subjectIds: (row.subjectIds || []).map(Number),
    }))
    setMapRows(next)
    setMapClassId((current) => (next.some((row) => row.classId === current) ? current : (next[0]?.classId || '')))
  }

  const loadTeacherAssignment = async (teacherId) => {
    setMapTeacherId(teacherId)
    setAddClassId('')
    if (!teacherId) {
      setMapRows([])
      setMapClassId('')
      return
    }
    try {
      const { data } = await api.get(`/staff/${teacherId}/assignments`)
      applyAssignmentRows(data.assignments)
    } catch (err) {
      error(err.response?.data?.message || 'Could not load this teacher’s classes')
    }
  }

  const addMappedClass = () => {
    const clazz = assignClasses.find((c) => String(c.id) === String(addClassId))
    if (!clazz) return
    if (mapRows.some((row) => row.classId === clazz.id)) {
      setMapClassId(clazz.id)
      setAddClassId('')
      return
    }
    const subjectIds = assignSubjects.filter((s) => s.level === clazz.level).map((s) => s.id)
    setMapRows([...mapRows, { classId: clazz.id, classTeacher: false, subjectIds }])
    setMapClassId(clazz.id)
    setAddClassId('')
  }

  const updateMappedClass = (classId, patch) => {
    setMapRows(mapRows.map((row) => (row.classId === classId ? { ...row, ...patch } : row)))
  }

  const saveTeacherAssignment = async (e) => {
    e.preventDefault()
    if (!mapTeacherId) return
    const teacher = teachers.find((t) => String(t.id) === String(mapTeacherId))
    const ok = await confirm({
      title: 'Save teacher assignment',
      message: `Save the classes and subjects for “${teacher?.fullName || 'this teacher'}”?`,
    })
    if (!ok) return
    try {
      const { data } = await api.put(`/staff/${mapTeacherId}/assignments`, { assignments: mapRows })
      applyAssignmentRows(data.assignments)
      success('Teacher assignment saved')
      await load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not save teacher assignment')
    }
  }

  const saveSubject = async (e) => {
    e.preventDefault()
    const ok = await confirm({
      title: editSubjectId ? 'Update subject' : 'Create subject',
      message: editSubjectId ? `Save changes to “${subjectForm.name}”?` : `Add “${subjectForm.name}” to the catalog?`,
    })
    if (!ok) return
    const body = {
      level,
      name: subjectForm.name,
      code: subjectForm.code || null,
      nurseryCategory: subjectForm.nurseryCategory || null,
    }
    if (subjectForm.maxEu !== '') body.maxEu = Number(subjectForm.maxEu)
    if (subjectForm.maxEt !== '') body.maxEt = Number(subjectForm.maxEt)
    if (subjectForm.maxTotal !== '') body.maxTotal = Number(subjectForm.maxTotal)
    try {
      if (editSubjectId) {
        await api.put(`/subjects/${editSubjectId}`, body)
        success('Subject updated successfully')
      } else {
        await api.post('/subjects', body)
        success('Subject created successfully')
      }
      setSubjectForm({ name: '', code: '', nurseryCategory: '', maxEu: '', maxEt: '', maxTotal: '' })
      setEditSubjectId(null)
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not save subject')
    }
  }

  const startEditSubject = (s) => {
    setEditSubjectId(s.id)
    setSubjectForm({
      name: s.name || '',
      code: s.code || '',
      nurseryCategory: s.nurseryCategory || '',
      maxEu: s.maxEu ?? '',
      maxEt: s.maxEt ?? '',
      maxTotal: s.maxTotal ?? '',
    })
  }

  const deleteSubject = async (id) => {
    const ok = await confirm({
      title: 'Delete subject',
      message: 'Delete this subject from the school catalog? This cannot be undone if it has no marks.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/subjects/${id}`)
      success('Subject deleted successfully')
      load()
      if (selectedClassId) loadClassSubjects(selectedClassId)
    } catch (err) {
      error(err.response?.data?.message || 'Cannot delete subject')
    }
  }

  const addSubjectToClass = async (e) => {
    e.preventDefault()
    if (!selectedClassId || !addSubjectId) return
    const ok = await confirm({ title: 'Add subject', message: 'Add this subject to the selected class?' })
    if (!ok) return
    try {
      await api.post(`/classes/${selectedClassId}/subjects`, { subjectId: Number(addSubjectId) })
      setAddSubjectId('')
      success('Subject added to class')
      loadClassSubjects(selectedClassId)
    } catch (err) {
      error(err.response?.data?.message || 'Could not add subject')
    }
  }

  const assignSubjectTeacher = async (subjectId, teacherId) => {
    const ok = await confirm({ title: 'Assign teacher', message: 'Assign this teacher to the subject?' })
    if (!ok) return
    try {
      await api.post(`/classes/${selectedClassId}/subjects/${subjectId}/teacher`, null, {
        params: { teacherId },
      })
      success('Subject teacher assigned')
      loadClassSubjects(selectedClassId)
    } catch (err) {
      error(err.response?.data?.message || 'Could not assign teacher')
    }
  }

  const attachedIds = new Set(classSubjects.map((cs) => cs.subject?.id))
  const availableToAdd = subjects.filter((s) => !attachedIds.has(s.id))
  const classStudents = listClass
    ? students
        .filter((s) => Number(s.classId) === Number(listClass.id))
        .slice()
        .sort((a, b) => `${a.lastName || ''} ${a.firstName || ''}`.localeCompare(`${b.lastName || ''} ${b.firstName || ''}`))
    : []
  const yearName = years.find((y) => y.id === yearId)?.name || ''
  const activeMap = mapRows.find((row) => row.classId === mapClassId)
  const activeMapClass = assignClasses.find((c) => c.id === mapClassId)
  const activeSubjects = assignSubjects.filter((s) => s.level === activeMapClass?.level)

  const printClassList = () => {
    setPrintAllRoster(true)
    document.body.classList.add('class-list-printing')
    const done = () => {
      document.body.classList.remove('class-list-printing')
      setPrintAllRoster(false)
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    window.setTimeout(() => window.print(), 50)
  }

  const classesPage = usePagination(classes)
  const subjectsPage = usePagination(subjects)
  const rosterPage = usePagination(classStudents)
  const rosterRows = printAllRoster ? classStudents : rosterPage.pageItems

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Classes & subjects</h1>
          <p className="text-ink/60">Manage classes, school subject catalog, and subject teachers</p>
        </div>
        <select className="rounded-xl border border-line px-3 py-2" value={yearId || ''} onChange={async (e) => {
          const id = Number(e.target.value)
          setYearId(id)
          const [c, all] = await Promise.all([
            api.get('/classes', { params: { yearId: id, level: selectedLevel || undefined } }),
            api.get('/classes', { params: { yearId: id } }),
          ])
          setClasses(c.data)
          setYearClasses(all.data)
          if (canManage) setAssignClasses(all.data)
        }}>
          {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        <div className="space-y-4">
          {canManage && (
            <form onSubmit={createClass} className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">New class</h2>
              <input className="mt-3 w-full rounded-xl border border-line px-3 py-2" placeholder="e.g. NURSERY 1 / P5B" value={name} onChange={(e) => setName(e.target.value)} required />
              <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)}>
                <option value="">Class teacher (optional)</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
              <button className="mt-3 w-full rounded-xl bg-forest py-2 text-white">Create</button>
            </form>
          )}
          <form onSubmit={placeStudent} className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="font-semibold">Place student</h2>
            <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={fromClassId} onChange={(e) => { setFromClassId(e.target.value); setPlaceStudentId('') }}>
              <option value="">From class</option>
              {yearClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={placeStudentId} onChange={(e) => setPlaceStudentId(e.target.value)} required disabled={!fromClassId}>
              <option value="">Student</option>
              {fromStudents.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
            <select className="mt-3 w-full rounded-xl border border-line px-3 py-2" value={toClassId} onChange={(e) => setToClassId(e.target.value)} required>
              <option value="">Place in class</option>
              {yearClasses.filter((c) => String(c.id) !== String(fromClassId)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="mt-3 w-full rounded-xl bg-ink py-2 text-white">Save</button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {classesPage.pageItems.map((c) => (
              <div
                key={c.id}
                className={`rounded-2xl border bg-paper p-5 shadow-sm cursor-pointer ${selectedClassId === c.id ? 'border-forest ring-1 ring-forest' : 'border-line'}`}
                onClick={() => setSelectedClassId(c.id)}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-forest">{c.level}</p>
                <h3 className="mt-1 text-xl font-semibold">{c.name}</h3>
                {canManage ? (
                  <select
                    className="mt-2 w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                    value={c.classTeacher?.id || ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateClassTeacher(c.id, e.target.value)}
                  >
                    <option value="">Class teacher…</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-ink/60">Teacher: {c.classTeacher?.fullName || 'Unassigned'}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-white"
                    onClick={(e) => { e.stopPropagation(); setListClass(c) }}
                  >
                    Students
                  </button>
                  <Link to={`/app/marks?classId=${c.id}`} className="rounded-lg bg-sand px-3 py-1.5 text-sm font-medium" onClick={(e) => e.stopPropagation()}>Marks</Link>
                  <Link to={`/app/reports?classId=${c.id}`} className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white" onClick={(e) => e.stopPropagation()}>Reports</Link>
                </div>
              </div>
            ))}
            {classes.length === 0 && <p className="text-ink/60">No classes for this level yet.</p>}
          </div>
          <PaginationBar
            page={classesPage.page}
            totalPages={classesPage.totalPages}
            total={classesPage.total}
            pageSize={classesPage.pageSize}
            onPageChange={classesPage.setPage}
          />

          {selectedClassId && canManage && (
            <div className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">Subjects in class</h2>
              <form onSubmit={addSubjectToClass} className="mt-3 flex flex-wrap gap-2">
                <select className="flex-1 rounded-xl border border-line px-3 py-2" value={addSubjectId} onChange={(e) => setAddSubjectId(e.target.value)}>
                  <option value="">Add subject from catalog…</option>
                  {availableToAdd.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button className="rounded-xl bg-forest px-4 py-2 text-white text-sm">Add</button>
              </form>
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-ink/60">
                  <tr>
                    <th className="py-2">Subject</th>
                    <th className="py-2">Subject teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {classSubjects.map((cs) => (
                    <tr key={cs.id} className="border-t border-line">
                      <td className="py-2 font-medium">{cs.subject?.name}</td>
                      <td className="py-2">
                        <select
                          className="w-full rounded-lg border border-line px-2 py-1.5"
                          value={cs.teacher?.id || ''}
                          onChange={(e) => assignSubjectTeacher(cs.subject.id, e.target.value)}
                        >
                          <option value="">Assign teacher…</option>
                          {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {canManage && (
          <div className="rounded-2xl border border-line bg-paper p-4 h-fit">
            <h2 className="font-semibold">School subject catalog ({level})</h2>
            <form onSubmit={saveSubject} className="mt-3 space-y-2">
              <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Subject name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
              <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Code" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
              {level === 'NURSERY' && (
                <input className="w-full rounded-xl border border-line px-3 py-2" placeholder="Category" value={subjectForm.nurseryCategory} onChange={(e) => setSubjectForm({ ...subjectForm, nurseryCategory: e.target.value })} />
              )}
              {level === 'PRIMARY' && (
                <div className="grid grid-cols-3 gap-2">
                  <input className="rounded-xl border border-line px-2 py-2" placeholder="Max EU" value={subjectForm.maxEu} onChange={(e) => setSubjectForm({ ...subjectForm, maxEu: e.target.value })} />
                  <input className="rounded-xl border border-line px-2 py-2" placeholder="Max ET" value={subjectForm.maxEt} onChange={(e) => setSubjectForm({ ...subjectForm, maxEt: e.target.value })} />
                  <input className="rounded-xl border border-line px-2 py-2" placeholder="Max total" value={subjectForm.maxTotal} onChange={(e) => setSubjectForm({ ...subjectForm, maxTotal: e.target.value })} />
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 rounded-xl bg-forest py-2 text-white text-sm">{editSubjectId ? 'Update' : 'Create'}</button>
                {editSubjectId && (
                  <button type="button" className="rounded-xl border border-line px-3 py-2 text-sm" onClick={() => { setEditSubjectId(null); setSubjectForm({ name: '', code: '', nurseryCategory: '', maxEu: '', maxEt: '', maxTotal: '' }) }}>Cancel</button>
                )}
              </div>
            </form>
            <ul className="mt-4 divide-y divide-line">
              {subjectsPage.pageItems.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-xs text-ink/50">{s.code || s.nurseryCategory || '—'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" className="rounded-lg bg-sand px-2 py-1 text-xs" onClick={() => startEditSubject(s)}>Edit</button>
                    <button type="button" className="rounded-lg bg-ink/10 px-2 py-1 text-xs" onClick={() => deleteSubject(s.id)}>Del</button>
                  </div>
                </li>
              ))}
            </ul>
            <PaginationBar
              page={subjectsPage.page}
              totalPages={subjectsPage.totalPages}
              total={subjectsPage.total}
              pageSize={subjectsPage.pageSize}
              onPageChange={subjectsPage.setPage}
            />
          </div>
        )}
      </div>

      {canManage && (
        <form onSubmit={saveTeacherAssignment} className="mt-6 rounded-2xl border border-line bg-paper p-4">
          <h2 className="font-semibold">Teacher assignment</h2>
          <p className="mt-1 text-sm text-ink/60">Select a teacher, assign a class, then remove any subject they do not teach. New classes start with every subject selected.</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="space-y-1">
              {teachers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${String(mapTeacherId) === String(t.id) ? 'bg-ink text-white' : 'bg-sand'}`}
                  onClick={() => loadTeacherAssignment(t.id)}
                >
                  {t.fullName}
                </button>
              ))}
              {teachers.length === 0 && <p className="text-sm text-ink/60">No teachers yet.</p>}
            </div>
            {mapTeacherId && (
              <div>
                <div className="flex flex-wrap gap-2">
                  <select className="rounded-xl border border-line px-3 py-2 text-sm" value={addClassId} onChange={(e) => setAddClassId(e.target.value)}>
                    <option value="">Assign class</option>
                    {assignClasses.filter((c) => !mapRows.some((row) => row.classId === c.id)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" className="rounded-xl bg-sand px-3 py-2 text-sm font-medium" onClick={addMappedClass}>Add class</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mapRows.map((row) => {
                    const clazz = assignClasses.find((c) => c.id === row.classId)
                    return (
                      <button
                        key={row.classId}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-sm ${mapClassId === row.classId ? 'bg-forest text-white' : 'bg-sand'}`}
                        onClick={() => setMapClassId(row.classId)}
                      >
                        {clazz?.name || 'Class'}
                      </button>
                    )
                  })}
                </div>
                {activeMap && (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{activeMapClass?.name} subjects</p>
                      <div className="flex gap-3 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activeMap.classTeacher}
                            onChange={(e) => updateMappedClass(activeMap.classId, { classTeacher: e.target.checked })}
                          />
                          Class teacher
                        </label>
                        <button
                          type="button"
                          className="text-ink/60"
                          onClick={() => {
                            setMapRows(mapRows.filter((row) => row.classId !== activeMap.classId))
                            setMapClassId(mapRows.find((row) => row.classId !== activeMap.classId)?.classId || '')
                          }}
                        >
                          Remove class
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      {activeSubjects.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={activeMap.subjectIds.includes(s.id)}
                            onChange={(e) => {
                              const subjectIds = e.target.checked
                                ? [...activeMap.subjectIds, s.id]
                                : activeMap.subjectIds.filter((id) => id !== s.id)
                              updateMappedClass(activeMap.classId, { subjectIds })
                            }}
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <button className="mt-4 rounded-xl bg-forest px-4 py-2 text-sm font-medium text-white">Save assignment</button>
              </div>
            )}
          </div>
        </form>
      )}

      {listClass && (
        <div className="class-list-overlay fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-ink/40 p-4">
          <div className="class-list-sheet mt-8 w-full max-w-4xl rounded-2xl border border-line bg-paper p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-forest">{listClass.level}{yearName ? ` · ${yearName}` : ''}</p>
                <h2 className="mt-1 text-xl font-semibold">{listClass.name} — student list</h2>
                <p className="text-sm text-ink/60">{classStudents.length} student{classStudents.length === 1 ? '' : 's'}</p>
              </div>
              <div className="flex gap-2 no-print">
                <button type="button" className="rounded-xl bg-forest px-4 py-2 text-sm font-medium text-white" onClick={printClassList}>Print</button>
                <button type="button" className="rounded-xl border border-line px-4 py-2 text-sm" onClick={() => setListClass(null)}>Close</button>
              </div>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead className="bg-sand text-left">
                <tr>
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">First name</th>
                  <th className="px-3 py-2">Last name</th>
                  <th className="px-3 py-2">Sex</th>
                  <th className="px-3 py-2">Date of birth</th>
                </tr>
              </thead>
              <tbody>
                {rosterRows.map((s, index) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-3 py-2">{(printAllRoster ? index : rosterPage.startIndex + index) + 1}</td>
                    <td className="px-3 py-2">{s.uniqueId}</td>
                    <td className="px-3 py-2">{s.firstName}</td>
                    <td className="px-3 py-2">{s.lastName}</td>
                    <td className="px-3 py-2">{s.sex === 'M' ? 'Male' : s.sex === 'F' ? 'Female' : s.sex || '—'}</td>
                    <td className="px-3 py-2">{s.dateOfBirth || '—'}</td>
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-ink/60">No students in this class yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="no-print">
              <PaginationBar
                page={rosterPage.page}
                totalPages={rosterPage.totalPages}
                total={rosterPage.total}
                pageSize={rosterPage.pageSize}
                onPageChange={rosterPage.setPage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
