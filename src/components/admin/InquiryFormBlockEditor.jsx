import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import {
  DEFAULT_INQUIRY_FORM,
  INQUIRY_FORM_FIELDS,
  mergeInquiryFormConfig,
} from '../../lib/inquiryFormDefaults'
import { useNotice } from '../../context/NoticeContext'
import CollapsibleSection from './CollapsibleSection'
import { AdminInput, AdminTextarea } from './AdminField'

function truncate(text, max = 40) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function InquiryFormBlockEditor({ pageId }) {
  const [blockId, setBlockId] = useState(null)
  const [content, setContent] = useState(mergeInquiryFormConfig())
  const [loading, setLoading] = useState(true)
  const { showNotice, showBlockingError } = useNotice()

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', pageId)
        .eq('block_type', 'inquiry_form')
        .maybeSingle()

      if (error) {
        showBlockingError({ message: error.message })
        setLoading(false)
        return
      }

      if (data) {
        setBlockId(data.id)
        setContent(mergeInquiryFormConfig(data.content))
      } else {
        const { data: created, error: insertError } = await supabase
          .from('page_blocks')
          .insert({
            page_id: pageId,
            block_type: 'inquiry_form',
            sort_order: 999,
            content: DEFAULT_INQUIRY_FORM,
          })
          .select()
          .single()

        if (insertError) showBlockingError({ message: insertError.message })
        else if (created) {
          setBlockId(created.id)
          setContent(mergeInquiryFormConfig(created.content))
        }
      }

      setLoading(false)
    }

    if (pageId) load()
  }, [pageId])

  function updateField(key, value) {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!blockId) return

    const supabase = getSupabaseClient()
    const { error } = await supabase.from('page_blocks').update({ content }).eq('id', blockId)

    if (error) showBlockingError({ message: error.message })
    else showNotice({ title: 'Saved', message: 'Inquiry form copy updated.' })
  }

  if (loading) return <p className="admin-muted admin-loading-text">Loading inquiry form…</p>

  const summary = truncate(content.form_title || DEFAULT_INQUIRY_FORM.form_title)

  return (
    <CollapsibleSection title="Inquiry form" summary={summary}>
      <p className="admin-muted">
        Labels, placeholders, and messages for the contact form.
      </p>

      {INQUIRY_FORM_FIELDS.map((field) => (
        <label key={field.key}>
          {field.label}
          {field.textarea ? (
            <AdminTextarea
              rows={field.key === 'form_lead' || field.key === 'success_message' ? 3 : 2}
              value={content[field.key] ?? ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          ) : (
            <AdminInput
              value={content[field.key] ?? ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </label>
      ))}

      <button type="button" className="admin-btn admin-btn-primary admin-btn-xs" onClick={handleSave}>
        Save form copy
      </button>
    </CollapsibleSection>
  )
}
