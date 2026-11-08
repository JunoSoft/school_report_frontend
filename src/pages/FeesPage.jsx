import { useEffect, useState } from 'react'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function FeesPage() {
  const { confirm, success, error } = useFeedback()
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState({ studentId: '', itemName: 'School fees', amount: '', paid: '' })
  const feesPage = usePagination(fees)

  const load = async () => {
    setFees((await api.get('/fees')).data)
    setStudents((await api.get('/students')).data)
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const ok = await confirm({ title: 'Add fee record', message: 'Save this fee entry?' })
    if (!ok) return
    try {
      await api.post('/fees', {
        studentId: Number(form.studentId),
        itemName: form.itemName,
        amount: Number(form.amount),
        paid: Number(form.paid || 0),
      })
      setForm({ studentId: '', itemName: 'School fees', amount: '', paid: '' })
      success('Fee record saved successfully')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not save fee record')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Fee register</h1>
      <p className="text-ink/60">Simple accountant ledger for school fee items</p>
      <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border border-line bg-paper p-4 md:grid-cols-5">
        <select className="rounded-xl border border-line px-3 py-2" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
          <option value="">Student</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <input className="rounded-xl border border-line px-3 py-2" placeholder="Item" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
        <input className="rounded-xl border border-line px-3 py-2" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <input className="rounded-xl border border-line px-3 py-2" placeholder="Paid" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} />
        <button className="rounded-xl bg-forest px-4 py-2 font-semibold text-white">Add</button>
      </form>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-sand text-left">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {feesPage.pageItems.map((f) => (
              <tr key={f.id} className="border-t border-line">
                <td className="px-4 py-3">{f.studentName}</td>
                <td className="px-4 py-3">{f.itemName}</td>
                <td className="px-4 py-3">{f.amount}</td>
                <td className="px-4 py-3">{f.paid}</td>
                <td className="px-4 py-3 font-semibold">{f.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-line px-4 py-2">
          <PaginationBar
            page={feesPage.page}
            totalPages={feesPage.totalPages}
            total={feesPage.total}
            pageSize={feesPage.pageSize}
            onPageChange={feesPage.setPage}
          />
        </div>
      </div>
    </div>
  )
}
