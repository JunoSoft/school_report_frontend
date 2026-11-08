import { useEffect, useState } from 'react'
import api from '../api/client'
import PaginationBar from '../components/PaginationBar'
import { useFeedback } from '../feedback/FeedbackContext'
import usePagination from '../hooks/usePagination'

export default function NotificationsPage() {
  const { success, error } = useFeedback()
  const [items, setItems] = useState([])
  const page = usePagination(items)

  const load = () => api.get('/notifications').then((r) => setItems(r.data))
  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`)
      success('Notification marked as read')
      load()
    } catch (err) {
      error(err.response?.data?.message || 'Could not update notification')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="mt-6 space-y-3">
        {page.pageItems.map((n) => (
          <div key={n.id} className={`rounded-2xl border border-line p-4 ${n.read ? 'bg-paper' : 'bg-emerald-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{n.title}</h3>
                <p className="mt-1 text-sm text-ink/70 break-words">{n.body}</p>
                <p className="mt-2 text-xs text-ink/40">{n.createdAt}</p>
              </div>
              {!n.read && (
                <button onClick={() => markRead(n.id)} className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">Mark read</button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-ink/60">No notifications yet.</p>}
      </div>
      <PaginationBar
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
        pageSize={page.pageSize}
        onPageChange={page.setPage}
      />
    </div>
  )
}
