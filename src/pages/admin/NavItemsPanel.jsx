import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useSite } from '../../context/SiteContext'

const emptyItem = { label: '', path: '', sort_order: 0, is_visible: true }

export default function NavItemsPanel() {
  const { refresh: refreshSite } = useSite()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('nav_items')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) setStatus(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function updateItem(index, key, value) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  async function saveItem(item) {
    setStatus('Saving nav…')
    const supabase = getSupabaseClient()
    const payload = {
      label: item.label,
      path: item.path,
      sort_order: Number(item.sort_order),
      is_visible: item.is_visible,
    }

    const { error } = item.id
      ? await supabase.from('nav_items').update(payload).eq('id', item.id)
      : await supabase.from('nav_items').insert(payload)

    if (error) {
      setStatus(error.message)
      return
    }

    await load()
    await refreshSite()
    setStatus('Navigation saved.')
  }

  async function deleteItem(id) {
    if (!window.confirm('Delete this nav item?')) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('nav_items').delete().eq('id', id)
    if (error) setStatus(error.message)
    else {
      await load()
      await refreshSite()
      setStatus('Nav item deleted.')
    }
  }

  if (loading) return <p className="admin-muted">Loading navigation…</p>

  return (
    <div className="admin-form">
      <h2>Navigation</h2>
      <p className="admin-muted">Header links (e.g. Work, Contact Inquiry).</p>

      {items.map((item, index) => (
        <div key={item.id ?? index} className="admin-subcard">
          <label>
            Label
            <input value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} />
          </label>
          <label>
            Path
            <input value={item.path} onChange={(e) => updateItem(index, 'path', e.target.value)} />
          </label>
          <label>
            Sort order
            <input
              type="number"
              value={item.sort_order}
              onChange={(e) => updateItem(index, 'sort_order', e.target.value)}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={item.is_visible}
              onChange={(e) => updateItem(index, 'is_visible', e.target.checked)}
            />
            Visible
          </label>
          <div className="admin-row-actions">
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => saveItem(item)}>
              Save
            </button>
            {item.id && (
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => deleteItem(item.id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="admin-btn admin-btn-ghost"
        onClick={() => setItems((prev) => [...prev, { ...emptyItem, sort_order: prev.length }])}
      >
        + Add nav item
      </button>

      {status && <p className="admin-status">{status}</p>}
    </div>
  )
}
