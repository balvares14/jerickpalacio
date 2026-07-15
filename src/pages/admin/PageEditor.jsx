import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSupabaseClient } from '../../lib/supabaseClient'
import TemplatePreview, { TemplatePickerPreview } from '../../components/admin/TemplatePreview'
import MediaLibraryPicker from '../../components/admin/MediaLibraryPicker'
import { MediaThumb } from '../../components/MediaDisplay'
import {
  PAGE_TEMPLATES,
  TEMPLATE_LIST,
  getTemplateDefaults,
  mergePageSettings,
  isHomePage,
} from '../../lib/pageTemplates'
import PageBlocksEditor from '../../components/admin/PageBlocksEditor'
import InquiryFormBlockEditor from '../../components/admin/InquiryFormBlockEditor'
import CollapsibleSection from '../../components/admin/CollapsibleSection'
import { STORAGE_FOLDERS } from '../../lib/constants'
import { isContactPage } from '../../lib/inquiryFormDefaults'
import { useNotice } from '../../context/NoticeContext'
import FloatingSaveButton from '../../components/admin/FloatingSaveButton'
import { AdminInput, AdminTextarea } from '../../components/admin/AdminField'
import { importLegacyWorkGrid, loadHomeWorkItems } from '../../lib/workItems'

const PAGE_EDITOR_FORM_ID = 'page-editor-form'

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const emptyWorkItem = {
  title: '',
  subtitle: '',
  slug: '',
  sort_order: 0,
  is_published: false,
  cover_media_id: null,
}

export default function PageEditor() {
  const { pageId } = useParams()
  const navigate = useNavigate()
  const isNew = pageId === 'new'

  const [form, setForm] = useState({
    title: '',
    slug: '',
    template: 'single_column',
    is_published: false,
    meta_description: '',
    og_image_media_id: null,
    page_settings: {},
  })
  const [workItems, setWorkItems] = useState([])
  const [workDraft, setWorkDraft] = useState(emptyWorkItem)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [importingLegacy, setImportingLegacy] = useState(false)
  const { showNotice, showBlockingError } = useNotice()

  useEffect(() => {
    if (isNew) return

    async function load() {
      const supabase = getSupabaseClient()
      const { data: page, error } = await supabase.from('pages').select('*').eq('id', pageId).maybeSingle()

      if (error || !page) {
        if (error) {
          showBlockingError({ message: error.message })
        } else {
          showBlockingError({ title: 'Page not found', message: 'This page could not be loaded.' })
        }
        setLoading(false)
        return
      }

      // Slug /work must use the home template — repair rows that drifted to single_column
      const home = isHomePage(page)
      const template = home ? 'home' : page.template
      const pageSettings = mergePageSettings(template, page.page_settings)

      setForm({
        ...page,
        template,
        slug: home ? 'work' : page.slug,
        page_settings: pageSettings,
      })

      if (home && page.template !== 'home') {
        const { error: repairError } = await supabase
          .from('pages')
          .update({
            template: 'home',
            slug: 'work',
            page_type: 'custom',
            page_settings: pageSettings,
          })
          .eq('id', page.id)

        if (repairError) {
          console.error('Home template repair failed:', repairError)
        } else {
          showNotice({
            title: 'Home page fixed',
            message: 'This page was reset to the Home layout template.',
            autoDismissMs: 5000,
          })
        }
      }

      if (home) {
        try {
          const items = await loadHomeWorkItems(page.id)
          setWorkItems(items)
        } catch (err) {
          showBlockingError({ message: err.message || 'Could not load work grid items.' })
        }
      }

      setLoading(false)
    }

    load()
  }, [pageId, isNew])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateSetting(key, value) {
    setForm((prev) => ({
      ...prev,
      page_settings: { ...prev.page_settings, [key]: value },
    }))
  }

  function handleTemplateChange(template) {
    if (form.template === 'home' && template !== 'home') {
      if (!window.confirm('Home template includes the work grid. Change template anyway?')) return
    }
    setForm((prev) => ({
      ...prev,
      template,
      page_settings: { ...getTemplateDefaults(template), ...prev.page_settings },
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const supabase = getSupabaseClient()

    const slug =
      form.template === 'home' ? 'work' : form.slug || slugify(form.title)

    const isContact = slug === 'contact' || form.page_type === 'contact'

    const payload = {
      title: form.title,
      slug: isContact ? 'contact' : slug,
      template: form.template,
      page_type: form.template === 'home' ? 'custom' : isContact ? 'contact' : form.page_type || 'project',
      is_published: form.is_published,
      meta_description: form.meta_description || null,
      og_image_media_id: form.og_image_media_id,
      page_settings: form.page_settings,
    }

    if (isNew) {
      const { data, error } = await supabase.from('pages').insert(payload).select().single()
      if (error) {
        showBlockingError({ message: error.message })
        setSaving(false)
        return
      }
      showNotice({ title: 'Page created', message: `"${form.title}" is ready to edit.` })
      navigate(`/admin/pages/${data.id}`, { replace: true })
      setSaving(false)
      return
    }

    const { error } = await supabase.from('pages').update(payload).eq('id', pageId)
    if (error) {
      showBlockingError({ message: error.message })
    } else {
      showNotice({ title: 'Saved', message: 'Page settings were updated.' })
    }
    setSaving(false)
  }

  async function saveWorkItem(e) {
    e.preventDefault()
    const supabase = getSupabaseClient()
    const slug = workDraft.slug || slugify(workDraft.title)

    const payload = {
      page_id: pageId,
      title: workDraft.title,
      subtitle: workDraft.subtitle || null,
      slug,
      sort_order: Number(workDraft.sort_order),
      is_published: workDraft.is_published,
      cover_media_id: workDraft.cover_media_id,
    }

    if (workDraft.id) {
      const { error } = await supabase.from('work_items').update(payload).eq('id', workDraft.id)
      if (error) showBlockingError({ message: error.message })
      else {
        setWorkItems((prev) => prev.map((w) => (w.id === workDraft.id ? { ...w, ...payload, cover_media: workDraft.cover_media } : w)))
        setWorkDraft(emptyWorkItem)
        showNotice({ title: 'Grid item saved', message: workDraft.title })
      }
    } else {
      const { data: detailPage } = await supabase
        .from('pages')
        .insert({
          slug,
          title: workDraft.title,
          page_type: 'project',
          template: 'single_column',
          is_published: workDraft.is_published,
        })
        .select()
        .single()

      const { data, error } = await supabase
        .from('work_items')
        .insert({ ...payload, detail_page_id: detailPage?.id })
        .select(`*, cover_media:media_assets!cover_media_id (*)`)
        .single()

      if (error) showBlockingError({ message: error.message })
      else {
        setWorkItems((prev) => [...prev, data])
        setWorkDraft(emptyWorkItem)
        showNotice({ title: 'Grid item added', message: workDraft.title })
      }
    }
  }

  async function deleteWorkItem(id) {
    if (!window.confirm('Remove this grid item?')) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('work_items').delete().eq('id', id)
    if (error) showBlockingError({ message: error.message })
    else {
      setWorkItems((prev) => prev.filter((w) => w.id !== id))
      showNotice({ title: 'Removed', message: 'Grid item deleted.' })
    }
  }

  async function handleImportLegacy() {
    if (
      !window.confirm(
        'Import the default portfolio grid (Wedding Photography, Film & Digital Video, etc.) with their cover images?',
      )
    ) {
      return
    }
    setImportingLegacy(true)
    try {
      const created = await importLegacyWorkGrid(pageId)
      const items = await loadHomeWorkItems(pageId)
      setWorkItems(items)
      showNotice({
        title: 'Legacy grid imported',
        message: created.length
          ? `Added ${created.length} item${created.length === 1 ? '' : 's'}.`
          : 'Items already existed — linked any orphans to Home.',
      })
    } catch (err) {
      showBlockingError({ message: err.message || 'Import failed.' })
    }
    setImportingLegacy(false)
  }

  if (loading) return <p className="admin-muted">Loading page…</p>

  const isHome = isHomePage(form)
  const isContact = isContactPage(form)

  const availableTemplates = isHome
    ? TEMPLATE_LIST
    : TEMPLATE_LIST.filter((t) => t.id !== 'home' || isNew)

  return (
    <main className="admin-main">
      <div className="admin-main-inner page-editor">
        <Link to="/admin" className="admin-link-back">
          ← Back to dashboard
        </Link>

        <form id={PAGE_EDITOR_FORM_ID} className="admin-form" onSubmit={handleSave}>
          <div className="page-editor-header">
            <h1>{isNew ? 'New page' : `Edit: ${form.title}`}</h1>
          </div>

          <div className="page-editor-layout">
            <div className="page-editor-main">
              <fieldset>
                <legend>Page info</legend>
                <label>
                  Title
                  <AdminInput
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    required
                  />
                </label>
                {form.template !== 'home' && !isContact && (
                  <label>
                    Slug (URL: /your-slug)
                    <AdminInput
                      value={form.slug}
                      onChange={(e) => updateField('slug', e.target.value)}
                      placeholder={slugify(form.title || 'page')}
                    />
                  </label>
                )}
                {isHome && (
                  <p className="admin-muted">Home page URL is fixed at <strong>/work</strong>.</p>
                )}
                {isContact && (
                  <p className="admin-muted">Contact page URL is fixed at <strong>/contact</strong>.</p>
                )}
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => updateField('is_published', e.target.checked)}
                  />
                  Published
                </label>
                <label>
                  Meta description
                  <AdminTextarea
                    value={form.meta_description || ''}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                    rows={2}
                  />
                </label>
                <MediaLibraryPicker
                  label="Social preview image (optional)"
                  value={form.og_image_media_id}
                  onChange={(id) => updateField('og_image_media_id', id)}
                  accept="image/*"
                />
              </fieldset>

              {!isNew && isHome && (
                <fieldset>
                  <legend>Work grid items</legend>
                  <p className="admin-muted">Cards shown on the home page. Pick cover media from the library.</p>

                  {workItems.length === 0 && (
                    <div className="admin-subcard admin-subcard--compact">
                      <p className="admin-muted">
                        No grid items yet. The public site may still show the legacy static covers until you import or add items here.
                      </p>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary admin-btn-xs"
                        onClick={handleImportLegacy}
                        disabled={importingLegacy}
                      >
                        {importingLegacy ? 'Importing…' : 'Import legacy grid'}
                      </button>
                    </div>
                  )}

                  <ul className="work-items-list">
                    {workItems.map((item) => (
                      <li key={item.id} className="work-items-list-row">
                        <div className="work-items-list-main">
                          {item.cover_media?.public_url ? (
                            <MediaThumb asset={item.cover_media} className="work-items-thumb" />
                          ) : (
                            <div className="work-items-thumb work-items-thumb--empty" />
                          )}
                          <span>
                            <strong>{item.title}</strong> · /{item.slug}
                            {!item.cover_media_id && (
                              <span className="admin-muted"> · no cover</span>
                            )}
                          </span>
                        </div>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() =>
                              setWorkDraft({
                                ...item,
                                subtitle: item.subtitle ?? '',
                                cover_media: item.cover_media ?? null,
                              })
                            }
                          >
                            Edit
                          </button>
                          <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteWorkItem(item.id)}>
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="admin-subcard">
                    <h4>{workDraft.id ? 'Edit grid item' : 'Add grid item'}</h4>
                    <label>
                      Title
                      <AdminInput value={workDraft.title} onChange={(e) => setWorkDraft((p) => ({ ...p, title: e.target.value }))} />
                    </label>
                    <label>
                      Subtitle
                      <AdminInput value={workDraft.subtitle} onChange={(e) => setWorkDraft((p) => ({ ...p, subtitle: e.target.value }))} />
                    </label>
                    <label>
                      Slug
                      <AdminInput value={workDraft.slug} onChange={(e) => setWorkDraft((p) => ({ ...p, slug: e.target.value }))} placeholder={slugify(workDraft.title)} />
                    </label>
                    <MediaLibraryPicker
                      label="Cover media"
                      value={workDraft.cover_media_id}
                      previewAsset={workDraft.cover_media}
                      onChange={(id, asset) => setWorkDraft((p) => ({ ...p, cover_media_id: id, cover_media: asset }))}
                      accept="image/*,video/*"
                      folder={STORAGE_FOLDERS.covers}
                    />
                    <label className="admin-checkbox">
                      <input type="checkbox" checked={workDraft.is_published} onChange={(e) => setWorkDraft((p) => ({ ...p, is_published: e.target.checked }))} />
                      Published
                    </label>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={saveWorkItem}>
                      {workDraft.id ? 'Update item' : 'Add item'}
                    </button>
                    {workDraft.id && (
                      <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setWorkDraft(emptyWorkItem)}>
                        Cancel edit
                      </button>
                    )}
                  </div>
                </fieldset>
              )}

              {isHome ? (
                <HomeTemplateSettings settings={form.page_settings} onChange={updateSetting} />
              ) : (
                <>
                  {!isNew && (
                    <PageBlocksEditor pageId={pageId} excludeBlockTypes={['inquiry_form']} />
                  )}
                  <IntroSettings template={form.template} settings={form.page_settings} onChange={updateSetting} />
                  <PageLayoutSettings template={form.template} settings={form.page_settings} onChange={updateSetting} isContact={isContact} />
                </>
              )}

              {!isNew && isContact && <InquiryFormBlockEditor pageId={pageId} />}
            </div>

            <aside className="page-editor-sidebar">
              <h3>Layout theme</h3>
              <div className="template-picker-grid">
                {availableTemplates.map((t) => (
                  <TemplatePickerPreview
                    key={t.id}
                    template={t.id}
                    selected={form.template === t.id}
                    onSelect={handleTemplateChange}
                    settings={form.page_settings}
                  />
                ))}
              </div>
              <TemplatePreview template={form.template} settings={form.page_settings} />
            </aside>
          </div>

          <FloatingSaveButton formId={PAGE_EDITOR_FORM_ID} saving={saving} />
        </form>
      </div>
    </main>
  )
}

function introSummary(settings) {
  if (!settings.intro_enabled) return 'Hidden'
  return settings.intro_title || settings.intro_subtitle || 'Enabled, no title'
}

function HomeTemplateSettings({ settings, onChange }) {
  const mastheadOn = settings.masthead_enabled ?? true

  return (
    <fieldset>
      <legend>Home — masthead &amp; grid</legend>

      <div className="admin-nested-group">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={mastheadOn}
            onChange={(e) => onChange('masthead_enabled', e.target.checked)}
          />
          Show masthead
        </label>
        {mastheadOn && (
          <div className="admin-nested-fields">
            <label>
              Masthead title
              <AdminInput
                value={settings.masthead_title ?? ''}
                onChange={(e) => onChange('masthead_title', e.target.value)}
              />
            </label>
            <label>
              Masthead subtitle
              <AdminInput
                value={settings.masthead_subtitle ?? ''}
                onChange={(e) => onChange('masthead_subtitle', e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={settings.masthead_show_arrow ?? true}
          onChange={(e) => onChange('masthead_show_arrow', e.target.checked)}
        />
        Show scroll arrow
      </label>
      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={settings.show_back_to_top ?? false}
          onChange={(e) => onChange('show_back_to_top', e.target.checked)}
        />
        Show back to top arrow
      </label>
      <label>
        Grid columns
        <select
          value={settings.work_grid_columns ?? 2}
          onChange={(e) => onChange('work_grid_columns', Number(e.target.value))}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>
    </fieldset>
  )
}

function IntroSettings({ template, settings, onChange }) {
  const showIntro = PAGE_TEMPLATES[template]?.defaults?.intro_enabled !== undefined
  if (!showIntro) return null

  return (
    <CollapsibleSection title="Intro" summary={introSummary(settings)}>
      <label className="admin-checkbox">
        <input type="checkbox" checked={settings.intro_enabled ?? false} onChange={(e) => onChange('intro_enabled', e.target.checked)} />
        Show intro section (masthead-style)
      </label>
      <label>
        Intro title
        <AdminInput value={settings.intro_title ?? ''} onChange={(e) => onChange('intro_title', e.target.value)} disabled={!settings.intro_enabled} />
      </label>
      <label>
        Intro subtitle
        <AdminInput value={settings.intro_subtitle ?? ''} onChange={(e) => onChange('intro_subtitle', e.target.value)} disabled={!settings.intro_enabled} />
      </label>
    </CollapsibleSection>
  )
}

function PageLayoutSettings({ template, settings, onChange, isContact }) {
  const hasLayoutControls =
    (!isContact && 'show_page_title' in (PAGE_TEMPLATES[template]?.defaults ?? {})) ||
    template === 'multi_column'

  if (!hasLayoutControls) return null

  return (
    <fieldset className="page-layout-fieldset">
      <legend>{isContact ? 'Layout' : 'Page layout'}</legend>
      {!isContact && 'show_page_title' in (PAGE_TEMPLATES[template]?.defaults ?? {}) && (
        <label className="admin-checkbox">
          <input type="checkbox" checked={settings.show_page_title ?? true} onChange={(e) => onChange('show_page_title', e.target.checked)} />
          Show page title
        </label>
      )}
      {template === 'multi_column' && (
        <label>
          Grid columns
          <select value={settings.grid_columns ?? 3} onChange={(e) => onChange('grid_columns', Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
      )}
    </fieldset>
  )
}
