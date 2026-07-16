import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useSite } from '../../context/SiteContext'
import MediaLibraryPicker from '../../components/admin/MediaLibraryPicker'
import CollapsibleSection from '../../components/admin/CollapsibleSection'
import { STORAGE_FOLDERS } from '../../lib/constants'
import { useNotice } from '../../context/NoticeContext'
import FloatingSaveButton from '../../components/admin/FloatingSaveButton'
import { AdminInput } from '../../components/admin/AdminField'
import { isDirty, snapshotState } from '../../lib/dirtyState'

const SITE_SETTINGS_FORM_ID = 'site-settings-form'

const emptyNav = { label: '', path: '', sort_order: 0, is_visible: true }

function truncate(text, max = 48) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function settingsSnapshot(form, navItems) {
  return {
    form,
    nav: navItems.map((item) => ({
      id: item.id ?? null,
      label: item.label ?? '',
      path: item.path ?? '',
      sort_order: Number(item.sort_order) || 0,
      is_visible: Boolean(item.is_visible),
    })),
  }
}

export default function SiteSettingsPanel() {
  const { refresh: refreshSite } = useSite()
  const [settingsId, setSettingsId] = useState(null)
  const [form, setForm] = useState({
    logo_text: '',
    logo_link_path: '/contact',
    logo_media_id: null,
    footer_text: '',
    footer_link_path: '/contact',
    site_title: '',
  })
  const [navItems, setNavItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [baseline, setBaseline] = useState(null)
  const { showNotice, showBlockingError } = useNotice()

  const dirty = useMemo(
    () => isDirty(settingsSnapshot(form, navItems), baseline),
    [form, navItems, baseline],
  )

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const [settingsRes, navRes] = await Promise.all([
        supabase.from('site_settings').select('*').limit(1).maybeSingle(),
        supabase.from('nav_items').select('*').order('sort_order', { ascending: true }),
      ])

      let nextForm = form
      let nextNav = []

      if (settingsRes.error) showBlockingError({ message: settingsRes.error.message })
      else if (settingsRes.data) {
        setSettingsId(settingsRes.data.id)
        nextForm = {
          logo_text: settingsRes.data.logo_text ?? '',
          logo_link_path: settingsRes.data.logo_link_path ?? '/contact',
          logo_media_id: settingsRes.data.logo_media_id,
          footer_text: settingsRes.data.footer_text ?? '',
          footer_link_path: settingsRes.data.footer_link_path ?? '/contact',
          site_title: settingsRes.data.site_title ?? '',
        }
        setForm(nextForm)
      }

      if (navRes.data) {
        nextNav = navRes.data
        setNavItems(nextNav)
      }

      setBaseline(snapshotState(settingsSnapshot(nextForm, nextNav)))
      setLoading(false)
    }
    load()
  }, [])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateNav(index, key, value) {
    setNavItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  async function saveNavItem(item) {
    const supabase = getSupabaseClient()
    const payload = {
      label: item.label,
      path: item.path,
      sort_order: Number(item.sort_order),
      is_visible: item.is_visible,
    }
    return item.id
      ? supabase.from('nav_items').update(payload).eq('id', item.id)
      : supabase.from('nav_items').insert(payload).select().single()
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const supabase = getSupabaseClient()

    const { error: settingsError } = settingsId
      ? await supabase.from('site_settings').update(form).eq('id', settingsId)
      : await supabase.from('site_settings').insert(form)

    if (settingsError) {
      showBlockingError({ message: settingsError.message })
      setSaving(false)
      return
    }

    const savedNav = []
    for (const item of navItems) {
      if (!item.label || !item.path) continue
      const { data, error } = await saveNavItem(item)
      if (error) {
        showBlockingError({ message: error.message })
        setSaving(false)
        return
      }
      savedNav.push(data?.id ? { ...item, id: data.id } : item)
    }

    // Reload nav so newly inserted ids are tracked
    const { data: freshNav } = await supabase
      .from('nav_items')
      .select('*')
      .order('sort_order', { ascending: true })

    if (freshNav) setNavItems(freshNav)

    await refreshSite()
    setBaseline(snapshotState(settingsSnapshot(form, freshNav ?? savedNav)))
    showNotice({ title: 'Saved', message: 'Site settings updated.' })
    setSaving(false)
  }

  async function deleteNav(id) {
    if (!window.confirm('Delete this nav link?')) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('nav_items').delete().eq('id', id)
    if (error) showBlockingError({ message: error.message })
    else {
      const next = navItems.filter((n) => n.id !== id)
      setNavItems(next)
      setBaseline(snapshotState(settingsSnapshot(form, next)))
      await refreshSite()
      showNotice({ title: 'Removed', message: 'Navigation link deleted.' })
    }
  }

  const logoSummary = [
    form.logo_text || 'No logo text',
    form.logo_media_id ? 'image' : null,
    form.logo_link_path,
  ]
    .filter(Boolean)
    .join(' · ')

  const footerSummary = [truncate(form.footer_text) || 'No footer text', form.footer_link_path]
    .filter(Boolean)
    .join(' · ')

  const visibleNav = navItems.filter((n) => n.label)
  const navSummary =
    visibleNav.length === 0
      ? 'No links'
      : `${visibleNav.length} link${visibleNav.length === 1 ? '' : 's'} · ${visibleNav.map((n) => n.label).join(', ')}`

  if (loading) return <p className="admin-muted admin-loading-text">Loading settings…</p>

  return (
    <form id={SITE_SETTINGS_FORM_ID} className="admin-form admin-form--compact" onSubmit={handleSave}>
      <div className="admin-panel-heading">
        <h2 className="admin-panel-title">Site settings</h2>
        <p className="admin-muted">Logo, footer, and header navigation.</p>
      </div>

      <CollapsibleSection title="Logo" summary={logoSummary}>
        <label>
          Logo text
          <AdminInput value={form.logo_text} onChange={(e) => updateField('logo_text', e.target.value)} />
        </label>
        <MediaLibraryPicker
          label="Logo image (optional)"
          value={form.logo_media_id}
          onChange={(id) => updateField('logo_media_id', id)}
          accept="image/*"
          folder={STORAGE_FOLDERS.logo}
        />
        <label>
          Logo link path
          <AdminInput value={form.logo_link_path} onChange={(e) => updateField('logo_link_path', e.target.value)} />
        </label>
        <label>
          Site title (browser tab)
          <AdminInput value={form.site_title} onChange={(e) => updateField('site_title', e.target.value)} />
        </label>
      </CollapsibleSection>

      <CollapsibleSection title="Footer" summary={footerSummary}>
        <label>
          Footer text
          <AdminInput value={form.footer_text} onChange={(e) => updateField('footer_text', e.target.value)} />
        </label>
        <label>
          Footer link path
          <AdminInput value={form.footer_link_path} onChange={(e) => updateField('footer_link_path', e.target.value)} />
        </label>
      </CollapsibleSection>

      <CollapsibleSection title="Header navigation" summary={navSummary}>
        {navItems.map((item, index) => (
          <div key={item.id ?? index} className="admin-subcard admin-subcard--compact admin-nav-row">
            <label>
              Label
              <AdminInput value={item.label} onChange={(e) => updateNav(index, 'label', e.target.value)} />
            </label>
            <label>
              Path
              <AdminInput value={item.path} onChange={(e) => updateNav(index, 'path', e.target.value)} />
            </label>
            <label>
              Order
              <input
                type="number"
                value={item.sort_order}
                onChange={(e) => updateNav(index, 'sort_order', e.target.value)}
              />
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={item.is_visible}
                onChange={(e) => updateNav(index, 'is_visible', e.target.checked)}
              />
              Visible
            </label>
            {item.id && (
              <button type="button" className="admin-btn admin-btn-ghost admin-btn-xs" onClick={() => deleteNav(item.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-xs"
          onClick={() => setNavItems((prev) => [...prev, { ...emptyNav, sort_order: prev.length }])}
        >
          + Add nav link
        </button>
      </CollapsibleSection>

      <FloatingSaveButton formId={SITE_SETTINGS_FORM_ID} label="Save site settings" saving={saving} dirty={dirty} />
    </form>
  )
}
