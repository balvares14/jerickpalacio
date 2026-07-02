import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { uploadMediaAsset } from '../../lib/storage'
import { STORAGE_FOLDERS } from '../../lib/constants'
import { fetchAllWorkItems } from '../../hooks/useWorkItems'

const emptyItem = {
  slug: '',
  title: '',
  subtitle: '',
  sort_order: 0,
  is_published: false,
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function WorkItemsPanel() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(emptyItem)
  const [coverFile, setCoverFile] = useState(null)

  async function load() {
    try {
      const data = await fetchAllWorkItems()
      setItems(data)
    } catch (err) {
      setStatus(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function startNew() {
    setDraft({ ...emptyItem, sort_order: items.length })
    setCoverFile(null)
  }

  function editItem(item) {
    setDraft({
      id: item.id,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle ?? '',
      sort_order: item.sort_order,
      is_published: item.is_published,
      cover_media_id: item.cover_media_id,
      cover_media: item.cover_media,
    })
    setCoverFile(null)
  }

  async function saveItem(e) {
    e.preventDefault()
    setStatus('Saving work item…')

    try {
      const supabase = getSupabaseClient()
      let coverMediaId = draft.cover_media_id ?? null

      if (coverFile) {
        const asset = await uploadMediaAsset(coverFile, STORAGE_FOLDERS.covers)
        coverMediaId = asset.id
      }

      const slug = draft.slug || slugify(draft.title)
      const payload = {
        slug,
        title: draft.title,
        subtitle: draft.subtitle || null,
        sort_order: Number(draft.sort_order),
        is_published: draft.is_published,
        cover_media_id: coverMediaId,
      }

      if (draft.id) {
        const { error } = await supabase.from('work_items').update(payload).eq('id', draft.id)
        if (error) throw error
      } else {
        const { data: page, error: pageError } = await supabase
          .from('pages')
          .insert({
            slug,
            page_type: 'project',
            title: draft.title,
            is_published: draft.is_published,
          })
          .select()
          .single()

        if (pageError) throw pageError

        const { error } = await supabase
          .from('work_items')
          .insert({ ...payload, detail_page_id: page.id })
        if (error) throw error
      }

      await load()
      setDraft(emptyItem)
      setCoverFile(null)
      setStatus('Work item saved.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  async function deleteItem(id) {
    if (!window.confirm('Delete this work item?')) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('work_items').delete().eq('id', id)
    if (error) setStatus(error.message)
    else {
      await load()
      setStatus('Work item deleted.')
    }
  }

  if (loading) return <p className="admin-muted">Loading work items…</p>

  return (
    <div className="admin-form">
      <h2>Work grid</h2>
      <p className="admin-muted">Home page project covers. Publish to show on the live site.</p>

      <div className="admin-split">
        <div className="admin-list">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-list-item${draft.id === item.id ? ' is-active' : ''}`}
              onClick={() => editItem(item)}
            >
              <strong>{item.title}</strong>
              <span className="admin-muted">
                /{item.slug} · {item.is_published ? 'Published' : 'Draft'}
              </span>
              {item.cover_media?.public_url && (
                <img src={item.cover_media.public_url} alt="" className="admin-thumb" />
              )}
            </button>
          ))}
          <button type="button" className="admin-btn admin-btn-ghost" onClick={startNew}>
            + New work item
          </button>
        </div>

        <form className="admin-subcard" onSubmit={saveItem}>
          <label>
            Title
            <input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Subtitle (e.g. year)
            <input
              value={draft.subtitle}
              onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))}
            />
          </label>
          <label>
            Slug (route: /your-slug)
            <input
              value={draft.slug}
              onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))}
              placeholder={slugify(draft.title || 'project-slug')}
            />
          </label>
          <label>
            Sort order
            <input
              type="number"
              value={draft.sort_order}
              onChange={(e) => setDraft((p) => ({ ...p, sort_order: e.target.value }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={draft.is_published}
              onChange={(e) => setDraft((p) => ({ ...p, is_published: e.target.checked }))}
            />
            Published
          </label>
          <label>
            Cover image or video
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {draft.cover_media?.public_url && !coverFile && (
            <div className="admin-preview">
              {draft.cover_media.media_type === 'video' ? (
                <video src={draft.cover_media.public_url} muted controls className="admin-preview-media" />
              ) : (
                <img src={draft.cover_media.public_url} alt="" className="admin-preview-media" />
              )}
            </div>
          )}

          <div className="admin-row-actions">
            <button type="submit" className="admin-btn admin-btn-primary">
              Save work item
            </button>
            {draft.id && (
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => deleteItem(draft.id)}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>

      {status && <p className="admin-status">{status}</p>}
    </div>
  )
}
