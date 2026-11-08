import { useEffect, useState } from 'react'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function PlatformSchoolsPage() {
  const { confirm, success, error } = useFeedback()
  const [schools, setSchools] = useState([])
  const [templates, setTemplates] = useState([])
  const schoolsPage = usePagination(schools)
  const [form, setForm] = useState({
    name: '', code: '', district: '', email: '', phone: '',
    nurseryEnabled: true, primaryEnabled: true,
    nurseryTemplateId: '', primaryTemplateId: '',
  })

  const load = async () => {
    const [s, t] = await Promise.all([api.get('/schools'), api.get('/templates')])
    setSchools(s.data)
    setTemplates(t.data)
    setForm((f) => ({
      ...f,
      nurseryTemplateId: String(t.data.find((x) => x.level === 'NURSERY')?.id || ''),
      primaryTemplateId: String(t.data.find((x) => x.level === 'PRIMARY')?.id || ''),
    }))
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const ok = await confirm({ title: 'Create school', message: `Create school “${form.name}”?` })
    if (!ok) return
    try {
      await api.post('/schools', {
        ...form,
        nurseryTemplateId: form.nurseryTemplateId ? Number(form.nurseryTemplateId) : null,
        primaryTemplateId: form.primaryTemplateId ? Number(form.primaryTemplateId) : null,
      })
      setForm((f) => ({ ...f, name: '', code: '', district: '', email: '', phone: '' }))
      success('School created successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not create school')
    }
  }

  const assign = async (schoolId, level, templateId) => {
    const ok = await confirm({
      title: 'Assign template',
      message: `Assign this ${level.toLowerCase()} template to the school?`,
    })
    if (!ok) return
    try {
      await api.post(`/schools/${schoolId}/templates`, null, { params: { level, templateId } })
      success('Template assigned successfully')
    } catch (err) {
      error(err.response?.data?.message || 'Could not assign template')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Schools</h1>
      <p className="text-ink/60">Super admin creates schools and assigns nursery / primary templates</p>

      <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border border-line bg-paper p-4 md:grid-cols-3">
        {['name', 'code', 'district', 'email', 'phone'].map((k) => (
          <input key={k} className="rounded-xl border border-line px-3 py-2" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k === 'name'} />
        ))}
        <select className="rounded-xl border border-line px-3 py-2" value={form.nurseryTemplateId} onChange={(e) => setForm({ ...form, nurseryTemplateId: e.target.value })}>
          <option value="">Nursery template</option>
          {templates.filter((t) => t.level === 'NURSERY').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="rounded-xl border border-line px-3 py-2" value={form.primaryTemplateId} onChange={(e) => setForm({ ...form, primaryTemplateId: e.target.value })}>
          <option value="">Primary template</option>
          {templates.filter((t) => t.level === 'PRIMARY').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="rounded-xl bg-forest px-4 py-2 font-semibold text-white">Add school</button>
      </form>

      <div className="mt-6 grid gap-4">
        {schoolsPage.pageItems.map((s) => (
          <div key={s.id} className="rounded-2xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold truncate">{s.name}</h2>
                <p className="text-sm text-ink/60 break-words">{s.code} · {s.district} · {s.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {templates.filter((t) => t.level === 'NURSERY').map((t) => (
                  <button key={t.id} onClick={() => assign(s.id, 'NURSERY', t.id)} className="rounded-lg bg-sand px-3 py-1.5 text-xs font-medium">Assign nursery: {t.name}</button>
                ))}
                {templates.filter((t) => t.level === 'PRIMARY').map((t) => (
                  <button key={`p-${t.id}`} onClick={() => assign(s.id, 'PRIMARY', t.id)} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white">Assign primary: {t.name}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <PaginationBar
        page={schoolsPage.page}
        totalPages={schoolsPage.totalPages}
        total={schoolsPage.total}
        pageSize={schoolsPage.pageSize}
        onPageChange={schoolsPage.setPage}
      />
    </div>
  )
}
