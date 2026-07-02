import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { BLOCK_TYPES, BLOCK_TYPE_LIST } from '../../lib/blockTypes'
import MediaLibraryPicker from './MediaLibraryPicker'
import { STORAGE_FOLDERS } from '../../lib/constants'
import { useNotice } from '../../context/NoticeContext'
import { AdminInput, AdminTextarea } from './AdminField'

function BlockEditor({ block, mediaMap, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const meta = BLOCK_TYPES[block.block_type]
  const content = block.content || {}

  function setContent(key, value) {
    onUpdate(block.id, { ...content, [key]: value })
  }

  return (
    <div className="block-editor-card">
      <div className="block-editor-header">
        <span className="block-editor-type">
          {meta?.icon} {meta?.label || block.block_type}
        </span>
        <div className="admin-row-actions">
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" disabled={isFirst} onClick={onMoveUp}>
            ↑
          </button>
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" disabled={isLast} onClick={onMoveDown}>
            ↓
          </button>
          <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => onDelete(block.id)}>
            ×
          </button>
        </div>
      </div>

      {block.block_type === 'heading' && (
        <>
          <label>
            Text
            <AdminInput value={content.text ?? ''} onChange={(e) => setContent('text', e.target.value)} />
          </label>
          <label>
            Level
            <select value={content.level ?? 2} onChange={(e) => setContent('level', Number(e.target.value))}>
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
        </>
      )}

      {block.block_type === 'paragraph' && (
        <label>
          Text
          <AdminTextarea rows={4} value={content.text ?? ''} onChange={(e) => setContent('text', e.target.value)} />
        </label>
      )}

      {block.block_type === 'image' && (
        <>
          <MediaLibraryPicker
            label="Image"
            value={content.media_id}
            onChange={(id) => setContent('media_id', id)}
            accept="image/*"
            folder={STORAGE_FOLDERS.gallery}
          />
          {content.media_id && mediaMap[content.media_id] && (
            <img src={mediaMap[content.media_id].public_url} alt="" className="block-editor-preview" />
          )}
          <label>
            Caption
            <AdminInput value={content.caption ?? ''} onChange={(e) => setContent('caption', e.target.value)} />
          </label>
          <label>
            Alt text
            <AdminInput value={content.alt ?? ''} onChange={(e) => setContent('alt', e.target.value)} />
          </label>
        </>
      )}

      {block.block_type === 'video' && (
        <>
          <MediaLibraryPicker
            label="Video"
            value={content.media_id}
            onChange={(id) => setContent('media_id', id)}
            accept="video/*"
            folder={STORAGE_FOLDERS.gallery}
          />
          <MediaLibraryPicker
            label="Poster image (optional)"
            value={content.poster_media_id}
            onChange={(id) => setContent('poster_media_id', id)}
            accept="image/*"
          />
          <label>
            Caption
            <AdminInput value={content.caption ?? ''} onChange={(e) => setContent('caption', e.target.value)} />
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" checked={content.autoplay ?? false} onChange={(e) => setContent('autoplay', e.target.checked)} />
            Autoplay (muted)
          </label>
        </>
      )}

      {block.block_type === 'audio' && (
        <>
          <MediaLibraryPicker
            label="Audio file"
            value={content.media_id}
            onChange={(id) => setContent('media_id', id)}
            accept="audio/*"
            folder={STORAGE_FOLDERS.audio}
          />
          <label>
            Title
            <AdminInput value={content.title ?? ''} onChange={(e) => setContent('title', e.target.value)} />
          </label>
        </>
      )}

      {block.block_type === 'image_row' && (
        <>
          <label>
            Columns
            <select value={content.columns ?? 2} onChange={(e) => setContent('columns', Number(e.target.value))}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <ImageRowPicker
            mediaIds={content.media_ids ?? []}
            mediaMap={mediaMap}
            onChange={(ids) => setContent('media_ids', ids)}
          />
        </>
      )}

      {block.block_type === 'text_media_split' && (
        <>
          <label>
            Text
            <AdminTextarea rows={4} value={content.text ?? ''} onChange={(e) => setContent('text', e.target.value)} />
          </label>
          <MediaLibraryPicker
            label="Media (image or video)"
            value={content.media_id}
            onChange={(id) => setContent('media_id', id)}
            accept="image/*,video/*"
            folder={STORAGE_FOLDERS.gallery}
          />
          <label>
            Media position
            <select value={content.media_position ?? 'left'} onChange={(e) => setContent('media_position', e.target.value)}>
              <option value="left">Media left</option>
              <option value="right">Media right</option>
            </select>
          </label>
          <label>
            Caption
            <AdminInput value={content.caption ?? ''} onChange={(e) => setContent('caption', e.target.value)} />
          </label>
        </>
      )}

      {block.block_type === 'spacer' && (
        <label>
          Size
          <select value={content.size ?? 'md'} onChange={(e) => setContent('size', e.target.value)}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>
      )}
    </div>
  )
}

function ImageRowPicker({ mediaIds, mediaMap, onChange }) {
  function addSlot() {
    onChange([...mediaIds, null])
  }

  function setAt(index, id) {
    const next = [...mediaIds]
    next[index] = id
    onChange(next)
  }

  function removeAt(index) {
    onChange(mediaIds.filter((_, i) => i !== index))
  }

  return (
    <div className="image-row-picker">
      <p className="admin-muted">Add images to the row — pick from library for each slot.</p>
      {mediaIds.map((id, index) => (
        <div key={index} className="image-row-picker-slot">
          <MediaLibraryPicker
            label={`Image ${index + 1}`}
            value={id}
            onChange={(mediaId) => setAt(index, mediaId)}
            accept="image/*"
            folder={STORAGE_FOLDERS.gallery}
          />
          {id && mediaMap[id] && <img src={mediaMap[id].public_url} alt="" className="block-editor-preview" />}
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => removeAt(index)}>
            Remove slot
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={addSlot}>
        + Add image to row
      </button>
    </div>
  )
}

export default function PageBlocksEditor({ pageId, excludeBlockTypes = [] }) {
  const [blocks, setBlocks] = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const { showNotice, showBlockingError } = useNotice()

  async function loadMedia(ids) {
    if (!ids.length) return
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('media_assets').select('*').in('id', ids)
    if (data) {
      setMediaMap((prev) => {
        const next = { ...prev }
        data.forEach((m) => { next[m.id] = m })
        return next
      })
    }
  }

  async function loadBlocks() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('page_blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true })

      if (error) showBlockingError({ message: error.message })
      else {
        const filtered = (data ?? []).filter((b) => !excludeBlockTypes.includes(b.block_type))
        setBlocks(filtered)
        const ids = []
        for (const b of filtered) {
          const c = b.content || {}
          if (c.media_id) ids.push(c.media_id)
          if (c.poster_media_id) ids.push(c.poster_media_id)
          if (c.media_ids) ids.push(...c.media_ids.filter(Boolean))
        }
        await loadMedia([...new Set(ids)])
      }
    setLoading(false)
  }

  useEffect(() => {
    if (pageId) loadBlocks()
  }, [pageId, excludeBlockTypes.join(',')])

  async function addBlock(blockType) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('page_blocks')
      .insert({
        page_id: pageId,
        block_type: blockType,
        sort_order: blocks.length,
        content: BLOCK_TYPES[blockType].defaultContent,
      })
      .select()
      .single()

    if (error) showBlockingError({ message: error.message })
    else {
      setBlocks((prev) => [...prev, data])
      showNotice({ title: 'Block added', message: BLOCK_TYPES[blockType].label })
    }
  }

  async function updateBlock(id, content) {
    const sanitized = { ...content }
    if (Array.isArray(sanitized.media_ids)) {
      sanitized.media_ids = sanitized.media_ids.filter(Boolean)
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('page_blocks').update({ content: sanitized }).eq('id', id)
    if (error) showBlockingError({ message: error.message })
    else {
      setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: sanitized } : b)))
      const ids = []
      if (sanitized.media_id) ids.push(sanitized.media_id)
      if (sanitized.poster_media_id) ids.push(sanitized.poster_media_id)
      if (sanitized.media_ids) ids.push(...sanitized.media_ids.filter(Boolean))
      await loadMedia(ids)
      showNotice({ title: 'Block updated', message: 'Content saved.', autoDismissMs: 3000 })
    }
  }

  async function deleteBlock(id) {
    if (!window.confirm('Delete this content block?')) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('page_blocks').delete().eq('id', id)
    if (error) showBlockingError({ message: error.message })
    else {
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      showNotice({ title: 'Block deleted', message: 'Content block removed.' })
    }
  }

  async function moveBlock(index, direction) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= blocks.length) return
    const reordered = [...blocks]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)
    setBlocks(reordered)

    const supabase = getSupabaseClient()
    await Promise.all(
      reordered.map((b, i) => supabase.from('page_blocks').update({ sort_order: i }).eq('id', b.id)),
    )
  }

  if (loading) return <p className="admin-muted admin-loading-text">Loading content…</p>

  return (
    <section className="page-content-section">
      <div className="page-content-section-header">
        <h3 className="page-content-section-title">Page content</h3>
        <span className="page-content-section-meta">
          {blocks.length === 0 ? 'No blocks yet' : `${blocks.length} block${blocks.length === 1 ? '' : 's'}`}
        </span>
      </div>
      <p className="admin-muted page-content-section-lead">
        Text, images, video, and audio — pick from your media library.
      </p>

      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          mediaMap={mediaMap}
          onUpdate={updateBlock}
          onDelete={deleteBlock}
          onMoveUp={() => moveBlock(index, -1)}
          onMoveDown={() => moveBlock(index, 1)}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
        />
      ))}

      <div className="block-add-menu">
        <span className="admin-muted">Add block:</span>
        <div className="block-add-buttons">
          {BLOCK_TYPE_LIST.filter(
            (t) => !excludeBlockTypes.includes(t.id) && !t.contactOnly,
          ).map((t) => (
            <button key={t.id} type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => addBlock(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
