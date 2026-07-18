import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { getTemplateLabel, isHomePage } from '../../lib/pageTemplates'
import { useNotice } from '../../context/NoticeContext'
import LoadingOverlay from '../../components/LoadingOverlay'

function pagePath(page) {
  if (isHomePage(page)) return '/work'
  return page.slug ? `/${page.slug}` : '—'
}

export default function PagesPanel() {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const { showNotice, showBlockingError } = useNotice()

  async function load() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('title', { ascending: true })

    if (error) showBlockingError({ message: error.message })
    else setPages(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openEditor(page) {
    navigate(`/admin/pages/${page.id}`)
  }

  async function handleDelete(page, e) {
    e.stopPropagation()
    if (isHomePage(page)) {
      showNotice({
        title: 'Cannot delete',
        message: 'The Home page cannot be deleted.',
        backgroundColor: '#fef3f2',
        borderColor: '#b42318',
        textColor: '#b42318',
        autoDismissMs: 5000,
      })
      return
    }
    if (!window.confirm(`Delete "${page.title}"?`)) return

    const supabase = getSupabaseClient()
    const { error } = await supabase.from('pages').delete().eq('id', page.id)
    if (error) showBlockingError({ message: error.message })
    else {
      setPages((prev) => prev.filter((p) => p.id !== page.id))
      showNotice({ title: 'Page deleted', message: `"${page.title}" was removed.` })
    }
  }

  if (loading) return <LoadingOverlay active variant="inline" label="Loading pages" />

  return (
    <div className="admin-form admin-form--compact">
      <div className="pages-panel-header">
        <div>
          <h2 className="admin-panel-title">Pages</h2>
          <p className="admin-muted">Sorted by title · click a row to edit</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary admin-btn-xs"
          onClick={() => navigate('/admin/pages/new')}
        >
          + New page
        </button>
      </div>

      {pages.length === 0 ? (
        <p className="admin-muted">No pages yet. Create a new page to get started.</p>
      ) : (
        <ul className="pages-list">
          {pages.map((page) => (
            <li key={page.id} className="pages-list-item">
              <button type="button" className="pages-list-row" onClick={() => openEditor(page)}>
                <div className="pages-list-main">
                  <span className="pages-list-title">{page.title}</span>
                  <span className={`pages-list-status${page.is_published ? ' is-published' : ' is-draft'}`}>
                    {page.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="pages-list-meta">
                  <span className="pages-list-path">{pagePath(page)}</span>
                  <span className="pages-list-sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="pages-list-template">{getTemplateLabel(isHomePage(page) ? 'home' : page.template)}</span>
                </div>
              </button>
              {!isHomePage(page) && (
                <button
                  type="button"
                  className="pages-list-action pages-list-action--danger"
                  title="Delete"
                  onClick={(e) => handleDelete(page, e)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
