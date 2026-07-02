import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useSite } from '../../context/SiteContext'

export default function SiteSettingsPanel() {
  const { refresh: refreshSite } = useSite()
  const [settingsId, setSettingsId] = useState(null)
  const [form, setForm] = useState({
    logo_text: '',
    logo_link_path: '/contact',
    footer_text: '',
    footer_link_path: '/contact',
    masthead_enabled: true,
    masthead_title: '',
    masthead_subtitle: '',
    masthead_show_arrow: true,
    work_grid_columns: 2,
    site_title: '',
  })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()
      if (error) {
        setStatus(error.message)
      } else if (data) {
        setSettingsId(data.id)
        setForm({
          logo_text: data.logo_text ?? '',
          logo_link_path: data.logo_link_path ?? '/contact',
          footer_text: data.footer_text ?? '',
          footer_link_path: data.footer_link_path ?? '/contact',
          masthead_enabled: data.masthead_enabled ?? true,
          masthead_title: data.masthead_title ?? '',
          masthead_subtitle: data.masthead_subtitle ?? '',
          masthead_show_arrow: data.masthead_show_arrow ?? true,
          work_grid_columns: data.work_grid_columns ?? 2,
          site_title: data.site_title ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setStatus('Saving…')
    const supabase = getSupabaseClient()
    const payload = { ...form, work_grid_columns: Number(form.work_grid_columns) }

    const { error } = settingsId
      ? await supabase.from('site_settings').update(payload).eq('id', settingsId)
      : await supabase.from('site_settings').insert(payload)

    if (error) {
      setStatus(error.message)
      return
    }

    await refreshSite()
    setStatus('Saved.')
  }

  if (loading) return <p className="admin-muted">Loading settings…</p>

  return (
    <form className="admin-form" onSubmit={handleSave}>
      <h2>Site settings</h2>
      <p className="admin-muted">Logo, masthead, footer, and grid layout for the home page.</p>

      <fieldset>
        <legend>Logo &amp; footer</legend>
        <label>
          Logo text
          <input value={form.logo_text} onChange={(e) => updateField('logo_text', e.target.value)} />
        </label>
        <label>
          Logo link path
          <input value={form.logo_link_path} onChange={(e) => updateField('logo_link_path', e.target.value)} />
        </label>
        <label>
          Footer text
          <input value={form.footer_text} onChange={(e) => updateField('footer_text', e.target.value)} />
        </label>
        <label>
          Footer link path
          <input value={form.footer_link_path} onChange={(e) => updateField('footer_link_path', e.target.value)} />
        </label>
        <label>
          Site title (browser tab)
          <input value={form.site_title} onChange={(e) => updateField('site_title', e.target.value)} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Masthead</legend>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.masthead_enabled}
            onChange={(e) => updateField('masthead_enabled', e.target.checked)}
          />
          Show masthead on home page
        </label>
        <label>
          Masthead title
          <input value={form.masthead_title} onChange={(e) => updateField('masthead_title', e.target.value)} />
        </label>
        <label>
          Masthead subtitle
          <input
            value={form.masthead_subtitle}
            onChange={(e) => updateField('masthead_subtitle', e.target.value)}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.masthead_show_arrow}
            onChange={(e) => updateField('masthead_show_arrow', e.target.checked)}
          />
          Show scroll arrow
        </label>
      </fieldset>

      <fieldset>
        <legend>Work grid</legend>
        <label>
          Grid columns
          <select
            value={form.work_grid_columns}
            onChange={(e) => updateField('work_grid_columns', e.target.value)}
          >
            <option value={1}>1 column</option>
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
          </select>
        </label>
      </fieldset>

      <button type="submit" className="admin-btn admin-btn-primary">
        Save settings
      </button>
      {status && <p className="admin-status">{status}</p>}
    </form>
  )
}
