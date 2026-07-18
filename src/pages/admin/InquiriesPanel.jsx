import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import LoadingOverlay from '../../components/LoadingOverlay'

export default function InquiriesPanel() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) setError(err.message)
      else setInquiries(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingOverlay active variant="inline" label="Loading inquiries" />

  return (
    <div className="admin-form admin-form--compact">
      <div className="admin-panel-heading">
        <h2 className="admin-panel-title">Inquiries</h2>
        <p className="admin-muted">Messages from the contact form.</p>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {inquiries.length === 0 ? (
        <p className="admin-muted">No inquiries yet.</p>
      ) : (
        <ul className="inquiries-list">
          {inquiries.map((row) => (
            <li key={row.id} className="inquiry-card">
              <div className="inquiry-card-meta">
                <strong>{row.name || 'Anonymous'}</strong>
                <time dateTime={row.created_at}>
                  {new Date(row.created_at).toLocaleString()}
                </time>
              </div>
              <div className="inquiry-card-contact">
                {row.email && <a href={`mailto:${row.email}`}>{row.email}</a>}
                {row.email && row.phone && ' · '}
                {row.phone && <a href={`tel:${row.phone}`}>{row.phone}</a>}
              </div>
              <p className="inquiry-card-message preserve-whitespace">{row.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
