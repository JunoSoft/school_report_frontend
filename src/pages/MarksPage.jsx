import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import { useAuth } from '../auth/AuthContext'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function MarksPage() {
  const { selectedLevel } = useAuth()
  const { confirm, success, error } = useFeedback()
  const [params] = useSearchParams()
  const [terms, setTerms] = useState([])
  const [classes, setClasses] = useState([])
  const [classSubjects, setClassSubjects] = useState([])
  const [classId, setClassId] = useState(params.get('classId') || '')
  const [termId, setTermId] = useState('')
  const [entryType, setEntryType] = useState('ASSESSMENT')
  const [subjectId, setSubjectId] = useState('')
  const [entryName, setEntryName] = useState('')
  const [sessions, setSessions] = useState([])
  const [sheet, setSheet] = useState(null)
  const [scores, setScores] = useState({})
  const [grid, setGrid] = useState(null)
  const [tab, setTab] = useState('record')

  useEffect(() => {
    ;(async () => {
      const y = await api.get('/years')
      const current = y.data.find((x) => x.currentYear) || y.data[0]
      if (!current) return
      const t = await api.get(`/years/${current.id}/terms`)
      setTerms(t.data)
      setTermId(String(t.data[0]?.id || ''))
      const c = await api.get('/classes', { params: { yearId: current.id, level: selectedLevel || undefined } })
      setClasses(c.data)
      if (!classId && c.data[0]) setClassId(String(c.data[0].id))
    })()
  }, [selectedLevel])

  useEffect(() => {
    if (!classId) {
      setClassSubjects([])
      setSubjectId('')
      return
    }
    api.get(`/classes/${classId}/subjects`).then((r) => {
      const list = r.data || []
      setClassSubjects(list)
      const first = list[0]?.subject?.id
      setSubjectId(first ? String(first) : '')
    }).catch(() => setClassSubjects([]))
  }, [classId])

  const loadSessions = async () => {
    if (!classId || !termId || !subjectId) {
      setSessions([])
      return
    }
    const { data } = await api.get('/marks/entries/sessions', {
      params: { classId, termId, subjectId, type: entryType },
    })
    setSessions(data)
  }

  useEffect(() => {
    loadSessions()
    setSheet(null)
    setScores({})
    if (entryType === 'EXAM') setEntryName('Exam')
    else setEntryName('')
  }, [classId, termId, subjectId, entryType])

  const loadGrid = async () => {
    if (!classId || !termId) return
    const { data } = await api.get('/marks/grid', { params: { classId, termId } })
    setGrid(data)
  }

  useEffect(() => {
    if (tab === 'summary') loadGrid()
  }, [tab, classId, termId])

  const downloadSummary = async () => {
    if (!classId || !termId) {
      error('Select class and term first')
      return
    }
    try {
      const res = await api.get('/marks/export/summary', {
        params: { classId, termId },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'term-summary.xlsx'
      a.click()
      success('Term summary downloaded')
    } catch (err) {
      error(err.response?.data?.message || 'Could not download term summary')
    }
  }

  const openSheet = async (nameOverride) => {
    const name = entryType === 'EXAM' ? 'Exam' : (nameOverride ?? entryName)
    if (entryType === 'ASSESSMENT' && !String(name || '').trim()) {
      error('Enter an assessment name first')
      return
    }
    if (!classId || !termId || !subjectId) {
      error('Select class, term and subject')
      return
    }
    try {
      const { data } = await api.get('/marks/entries/sheet', {
        params: { classId, termId, subjectId, type: entryType, name },
      })
      setEntryName(data.name)
      setSheet(data)
      const map = {}
      for (const row of data.rows || []) {
        map[row.studentId] = row.score ?? ''
      }
      setScores(map)
    } catch (err) {
      error(err.response?.data?.message || 'Could not load mark sheet')
    }
  }

  const saveSheet = async () => {
    if (!sheet) return
    const ok = await confirm({
      title: `Save ${entryType === 'EXAM' ? 'exam' : 'assessment'}`,
      message: `Save scores for “${sheet.name}” (${sheet.subject?.name})?`,
    })
    if (!ok) return
    const payload = {
      classId: Number(classId),
      termId: Number(termId),
      subjectId: Number(subjectId),
      type: entryType,
      name: sheet.name,
      scores: Object.entries(scores).map(([studentId, score]) => ({
        studentId: Number(studentId),
        score: score === '' || score == null ? null : Number(score),
      })),
    }
    try {
      const { data } = await api.put('/marks/entries/sheet', payload)
      success(`Saved ${data.saved} score(s). Assessment average updates the report Assessment column.`)
      loadSessions()
      openSheet(sheet.name)
    } catch (err) {
      error(err.response?.data?.message || 'Could not save scores')
    }
  }

  const deleteSession = async (name) => {
    const ok = await confirm({
      title: 'Delete session',
      message: `Delete “${name}” and all its scores? Report averages will be recalculated.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete('/marks/entries/sessions', {
        params: { classId, termId, subjectId, type: entryType, name },
      })
      success('Session deleted')
      if (sheet?.name === name) {
        setSheet(null)
        setScores({})
      }
      loadSessions()
    } catch (err) {
      error(err.response?.data?.message || 'Could not delete session')
    }
  }

  const downloadTemplate = async () => {
    const name = entryType === 'EXAM' ? 'Exam' : entryName
    if (entryType === 'ASSESSMENT' && !String(name || '').trim()) {
      error('Enter assessment name before downloading template')
      return
    }
    try {
      const res = await api.get('/marks/entries/template', {
        params: { classId, termId, subjectId, type: entryType, name },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entryType.toLowerCase()}-template.xlsx`
      a.click()
    } catch (err) {
      error(err.response?.data?.message || 'Could not download template')
    }
  }

  const uploadExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const name = entryType === 'EXAM' ? 'Exam' : entryName
    if (entryType === 'ASSESSMENT' && !String(name || '').trim()) {
      error('Enter assessment name before importing')
      e.target.value = ''
      return
    }
    const ok = await confirm({
      title: 'Import Excel',
      message: `Import “${file.name}”? TYPE and NAME in the file must match ${entryType} / “${name}”. Unknown students are skipped.`,
    })
    if (!ok) {
      e.target.value = ''
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/marks/entries/import', fd, {
        params: { classId, termId, subjectId, type: entryType, name },
      })
      success(`Imported ${data.matched || data.saved || 0} score(s)${data.skipped ? `, skipped ${data.skipped}` : ''}`)
      loadSessions()
      openSheet(name)
    } catch (err) {
      error(err.response?.data?.message || 'Could not import Excel')
    } finally {
      e.target.value = ''
    }
  }

  const subjects = useMemo(
    () => classSubjects.map((cs) => cs.subject).filter(Boolean),
    [classSubjects]
  )
  const isNursery = grid?.class?.level === 'NURSERY'
  const sessionsPage = usePagination(sessions)
  const sheetRowsPage = usePagination(sheet?.rows || [])
  const gridRowsPage = usePagination(grid?.rows || [])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Marks</h1>
          <p className="text-ink/60">Record named assessments (averaged) or one exam per subject — then view report totals</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('record')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === 'record' ? 'bg-ink text-white' : 'bg-sand'}`}
          >
            Record
          </button>
          <button
            type="button"
            onClick={() => setTab('summary')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === 'summary' ? 'bg-ink text-white' : 'bg-sand'}`}
          >
            Term summary
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select className="rounded-xl border border-line px-3 py-2" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rounded-xl border border-line px-3 py-2" value={termId} onChange={(e) => setTermId(e.target.value)}>
          <option value="">Term</option>
          {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {tab === 'record' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">1. Type</h2>
              <div className="mt-3 flex gap-2">
                {['ASSESSMENT', 'EXAM'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEntryType(t)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
                      entryType === t ? 'bg-forest text-white' : 'bg-sand'
                    }`}
                  >
                    {t === 'ASSESSMENT' ? 'Assessment' : 'Exam'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink/55">
                {entryType === 'ASSESSMENT'
                  ? 'Many assessments allowed; report Assessment = average of all.'
                  : 'Only one exam per subject/term; becomes the Exam column.'}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">2. Subject</h2>
              <select
                className="mt-3 w-full rounded-xl border border-line px-3 py-2"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-line bg-paper p-4">
              <h2 className="font-semibold">3. {entryType === 'EXAM' ? 'Exam' : 'Assessment name'}</h2>
              {entryType === 'ASSESSMENT' ? (
                <input
                  className="mt-3 w-full rounded-xl border border-line px-3 py-2"
                  placeholder="e.g. CAT 1, Mid-term quiz"
                  value={entryName}
                  onChange={(e) => setEntryName(e.target.value)}
                />
              ) : (
                <p className="mt-3 rounded-xl bg-sand px-3 py-2 text-sm font-medium">Exam (fixed)</p>
              )}
              <button
                type="button"
                onClick={() => openSheet()}
                className="mt-3 w-full rounded-xl bg-ink py-2 text-sm font-semibold text-white"
              >
                Open mark sheet
              </button>
            </div>

            {sessions.length > 0 && (
              <div className="rounded-2xl border border-line bg-paper p-4">
                <h2 className="font-semibold">Saved {entryType === 'EXAM' ? 'exam' : 'assessments'}</h2>
                <ul className="mt-3 space-y-2">
                  {sessionsPage.pageItems.map((s) => (
                    <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                      <button type="button" className="text-left font-medium text-forest underline" onClick={() => openSheet(s.name)}>
                        {s.name} <span className="text-ink/50">({s.studentCount})</span>
                      </button>
                      <button type="button" className="text-xs text-red-600" onClick={() => deleteSession(s.name)}>Delete</button>
                    </li>
                  ))}
                </ul>
                <PaginationBar
                  page={sessionsPage.page}
                  totalPages={sessionsPage.totalPages}
                  total={sessionsPage.total}
                  pageSize={sessionsPage.pageSize}
                  onPageChange={sessionsPage.setPage}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-paper p-4">
            {!sheet ? (
              <p className="text-ink/60">Choose type, subject and name, then open the mark sheet to enter scores for this class.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-forest">{sheet.type}</p>
                    <h2 className="text-xl font-semibold">{sheet.name}</h2>
                    <p className="text-sm text-ink/60">{sheet.subject?.name} · {sheet.class?.name} · {sheet.term?.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={downloadTemplate} className="rounded-xl border border-line px-3 py-2 text-sm font-medium">
                      Excel template
                    </button>
                    <label className="cursor-pointer rounded-xl bg-sand px-3 py-2 text-sm font-medium">
                      Upload Excel
                      <input type="file" accept=".xlsx" className="hidden" onChange={uploadExcel} />
                    </label>
                    <button type="button" onClick={saveSheet} className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white">
                      Save scores
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-sand text-left">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetRowsPage.pageItems.map((row, idx) => (
                        <tr key={row.studentId} className="border-t border-line">
                          <td className="px-3 py-2 text-ink/50">{sheetRowsPage.startIndex + idx + 1}</td>
                          <td className="px-3 py-2">{row.uniqueId}</td>
                          <td className="px-3 py-2 font-medium">{row.fullName}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-24 rounded-lg border border-line px-2 py-1"
                              value={scores[row.studentId] ?? ''}
                              onChange={(e) => setScores((s) => ({ ...s, [row.studentId]: e.target.value }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  page={sheetRowsPage.page}
                  totalPages={sheetRowsPage.totalPages}
                  total={sheetRowsPage.total}
                  pageSize={sheetRowsPage.pageSize}
                  onPageChange={sheetRowsPage.setPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="mt-6 overflow-auto rounded-2xl border border-line bg-paper">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-sm text-ink/60">
              CAT column = average of all saved assessments for that subject in this term. Exam = the single exam score.
            </p>
            <button
              type="button"
              onClick={downloadSummary}
              disabled={!grid?.rows?.length}
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Download Excel
            </button>
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-sand">
              <tr>
                <th className="sticky left-0 bg-sand px-3 py-2 text-left">Student</th>
                {(grid?.subjects || []).map((s) => (
                  <th key={s.id} className="px-2 py-2" colSpan={2}>{s.name}</th>
                ))}
                {isNursery && <th className="px-3 py-2">Avg</th>}
              </tr>
              <tr className="border-t border-line">
                <th className="sticky left-0 bg-sand" />
                {(grid?.subjects || []).map((s) => (
                  <Fragment key={s.id}>
                    <th className="px-2 py-1">CAT</th>
                    <th className="px-2 py-1">Exam</th>
                  </Fragment>
                ))}
                {isNursery && <th />}
              </tr>
            </thead>
            <tbody>
              {gridRowsPage.pageItems.map((row) => (
                <tr key={row.studentId} className="border-t border-line">
                  <td className="sticky left-0 bg-paper px-3 py-2 font-medium whitespace-nowrap">{row.fullName}</td>
                  {(grid?.subjects || []).map((s) => {
                    const cell = row.scores?.[s.id] || {}
                    return (
                      <Fragment key={s.id}>
                        <td className="px-2 py-2 text-center">{cell.euScore ?? '—'}</td>
                        <td className="px-2 py-2 text-center">{cell.etScore ?? '—'}</td>
                      </Fragment>
                    )
                  })}
                  {isNursery && <td className="px-3 py-2 text-center">{row.average ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line px-4 py-2">
            <PaginationBar
              page={gridRowsPage.page}
              totalPages={gridRowsPage.totalPages}
              total={gridRowsPage.total}
              pageSize={gridRowsPage.pageSize}
              onPageChange={gridRowsPage.setPage}
            />
          </div>
          {!grid?.rows?.length && <p className="p-4 text-ink/60">No summary yet for this class/term.</p>}
        </div>
      )}
    </div>
  )
}
