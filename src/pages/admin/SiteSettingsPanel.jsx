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
import { DEFAULT_LOGO_LAYOUT, LOGO_LAYOUTS, normalizeLogoLayout } from '../../lib/logoLayouts'
import LoadingOverlay from '../../components/LoadingOverlay'
import { ThemeAppearanceFields } from '../../components/admin/BackgroundColorField'
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_COLOR,
  getFontMeta,
  normalizeBackgroundColor,
  normalizeFontFamily,
  normalizeTextColor,
} from '../../lib/siteTheme'

const SITE_SETTINGS_FORM_ID = 'site-settings-form'

const emptyNav = { label: '', path: '', sort_order: 0, is_visible: true }

function truncate(text, max = 48) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function layoutLabel(id) {
  return LOGO_LAYOUTS.find((item) => item.id === id)?.label ?? id
}

function settingsSnapshot(form, navItems) {
  return {
    form: {
      logo_text: form.logo_text ?? '',
      logo_link_path: form.logo_link_path ?? '/contact',
      logo_media_id: form.logo_media_id ?? null,
      logo_layout: normalizeLogoLayout(form.logo_layout),
      footer_text: form.footer_text ?? '',
      footer_link_path: form.footer_link_path ?? '/contact',
      footer_logo_layout: normalizeLogoLayout(form.footer_logo_layout),
      logo_as_favicon: Boolean(form.logo_as_favicon),
      background_color: normalizeBackgroundColor(form.background_color),
      text_color: normalizeTextColor(form.text_color),
      font_family: normalizeFontFamily(form.font_family),
      site_title: form.site_title ?? '',
    },
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
    logo_layout: DEFAULT_LOGO_LAYOUT,
    footer_text: '',
    footer_link_path: '/contact',
    footer_logo_layout: DEFAULT_LOGO_LAYOUT,
    logo_as_favicon: false,
    background_color: DEFAULT_BACKGROUND_COLOR,
    text_color: DEFAULT_TEXT_COLOR,
    font_family: DEFAULT_FONT_FAMILY,
    site_title: '',
  })
  const [navItems, setNavItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [applyingTheme, setApplyingTheme] = useState(false)
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
          logo_layout: normalizeLogoLayout(settingsRes.data.logo_layout),
          footer_text: settingsRes.data.footer_text ?? '',
          footer_link_path: settingsRes.data.footer_link_path ?? '/contact',
          footer_logo_layout: normalizeLogoLayout(settingsRes.data.footer_logo_layout),
          logo_as_favicon: Boolean(settingsRes.data.logo_as_favicon),
          background_color: normalizeBackgroundColor(settingsRes.data.background_color),
          text_color: normalizeTextColor(settingsRes.data.text_color),
          font_family: normalizeFontFamily(settingsRes.data.font_family),
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
    const next = key === 'sort_order' ? Number(value) || 0 : value
    setNavItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: next } : item)))
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

    const payload = {
      ...form,
      background_color: normalizeBackgroundColor(form.background_color),
      text_color: normalizeTextColor(form.text_color),
      font_family: normalizeFontFamily(form.font_family),
    }

    const { error: settingsError } = settingsId
      ? await supabase.from('site_settings').update(payload).eq('id', settingsId)
      : await supabase.from('site_settings').insert(payload)

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

    const { data: freshNav } = await supabase
      .from('nav_items')
      .select('*')
      .order('sort_order', { ascending: true })

    if (freshNav) setNavItems(freshNav)

    setForm(payload)
    await refreshSite()
    setBaseline(snapshotState(settingsSnapshot(payload, freshNav ?? savedNav)))
    showNotice({ title: 'Saved', message: 'Site settings updated.' })
    setSaving(false)
  }

  async function applyThemeToAllPages() {
    const theme = {
      background_color: normalizeBackgroundColor(form.background_color),
      text_color: normalizeTextColor(form.text_color),
      font_family: normalizeFontFamily(form.font_family),
    }
    if (
      !window.confirm(
        `Update all page appearances to this theme? This overwrites each page’s background, text color, and font, and saves them as the site defaults.`,
      )
    ) {
      return
    }

    setApplyingTheme(true)
    const supabase = getSupabaseClient()

    const settingsPayload = {
      ...form,
      ...theme,
    }

    const { error: settingsError } = settingsId
      ? await supabase.from('site_settings').update(theme).eq('id', settingsId)
      : await supabase.from('site_settings').insert(settingsPayload)

    if (settingsError) {
      showBlockingError({ message: settingsError.message })
      setApplyingTheme(false)
      return
    }

    const { data: pages, error: pagesError } = await supabase.from('pages').select('id, page_settings')
    if (pagesError) {
      showBlockingError({ message: pagesError.message })
      setApplyingTheme(false)
      return
    }

    const results = await Promise.all(
      (pages ?? []).map((page) =>
        supabase
          .from('pages')
          .update({
            page_settings: {
              ...(page.page_settings && typeof page.page_settings === 'object' ? page.page_settings : {}),
              ...theme,
            },
          })
          .eq('id', page.id),
      ),
    )

    const firstError = results.find((r) => r.error)?.error
    if (firstError) {
      showBlockingError({ message: firstError.message })
      setApplyingTheme(false)
      return
    }

    const nextForm = { ...form, ...theme }
    setForm(nextForm)
    await refreshSite()
    setBaseline(snapshotState(settingsSnapshot(nextForm, navItems)))
    showNotice({
      title: 'Theme updated',
      message: `Applied appearance to ${pages?.length ?? 0} page${(pages?.length ?? 0) === 1 ? '' : 's'} and the site defaults.`,
    })
    setApplyingTheme(false)
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
    form.logo_media_id ? layoutLabel(form.logo_layout) : 'text only',
    form.logo_as_favicon ? 'favicon' : null,
    form.logo_link_path,
  ]
    .filter(Boolean)
    .join(' · ')

  const footerSummary = [
    truncate(form.footer_text) || 'No footer text',
    form.logo_media_id ? layoutLabel(form.footer_logo_layout) : null,
    form.footer_link_path,
  ]
    .filter(Boolean)
    .join(' · ')

  const visibleNav = navItems.filter((n) => n.label)
  const navSummary =
    visibleNav.length === 0
      ? 'No links'
      : `${visibleNav.length} link${visibleNav.length === 1 ? '' : 's'} · ${visibleNav.map((n) => n.label).join(', ')}`

  if (loading) return <LoadingOverlay active variant="inline" label="Loading settings" />

  return (
    <>
      <form
        id={SITE_SETTINGS_FORM_ID}
        className="admin-form admin-form--compact admin-form--with-floating-save"
        onSubmit={handleSave}
      >
        <div className="admin-panel-heading">
          <h2 className="admin-panel-title">Site settings</h2>
          <p className="admin-muted">Logo, appearance, footer, and header navigation.</p>
        </div>

        <CollapsibleSection title="Logo" summary={logoSummary}>
          <label>
            Logo text
            <AdminInput value={form.logo_text} onChange={(e) => updateField('logo_text', e.target.value)} />
          </label>
          <MediaLibraryPicker
            label="Logo image (optional)"
            value={form.logo_media_id}
            onChange={(id) => {
              setForm((prev) => ({
                ...prev,
                logo_media_id: id,
                logo_as_favicon: id ? prev.logo_as_favicon : false,
                logo_layout: id ? prev.logo_layout : DEFAULT_LOGO_LAYOUT,
                footer_logo_layout: id ? prev.footer_logo_layout : DEFAULT_LOGO_LAYOUT,
              }))
            }}
            accept="image/*"
            folder={STORAGE_FOLDERS.logo}
          />
          <label>
            Header display
            <select
              value={form.logo_layout}
              onChange={(e) => updateField('logo_layout', e.target.value)}
              disabled={!form.logo_media_id}
            >
              {LOGO_LAYOUTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Logo link path
            <AdminInput value={form.logo_link_path} onChange={(e) => updateField('logo_link_path', e.target.value)} />
          </label>
          <label>
            Site title (browser tab)
            <AdminInput value={form.site_title} onChange={(e) => updateField('site_title', e.target.value)} />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.logo_as_favicon}
              disabled={!form.logo_media_id}
              onChange={(e) => updateField('logo_as_favicon', e.target.checked)}
            />
            Use logo image as favicon
          </label>
          {!form.logo_media_id && (
            <p className="admin-muted admin-field-hint">Upload a logo image to enable layout options and favicon.</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Appearance"
          summary={`${normalizeBackgroundColor(form.background_color)} · ${normalizeTextColor(form.text_color)} · ${getFontMeta(form.font_family).label}`}
        >
          <ThemeAppearanceFields
            values={form}
            onChange={(key, value) => updateField(key, value)}
          />
          <p className="admin-muted admin-field-hint">
            Site defaults for pages that inherit. Current defaults: white background, near-black text, Work Sans.
          </p>
          <button
            type="button"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            onClick={applyThemeToAllPages}
            disabled={applyingTheme || saving}
          >
            {applyingTheme ? 'Updating pages…' : 'Update all page appearances to this theme'}
          </button>
        </CollapsibleSection>

        <CollapsibleSection title="Footer" summary={footerSummary}>
          <label>
            Footer text
            <AdminInput value={form.footer_text} onChange={(e) => updateField('footer_text', e.target.value)} />
          </label>
          <label>
            Footer display
            <select
              value={form.footer_logo_layout}
              onChange={(e) => updateField('footer_logo_layout', e.target.value)}
              disabled={!form.logo_media_id}
            >
              {LOGO_LAYOUTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
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
      </form>

      <FloatingSaveButton
        formId={SITE_SETTINGS_FORM_ID}
        label="Save site settings"
        saving={saving}
        dirty={dirty}
      />
    </>
  )
}
