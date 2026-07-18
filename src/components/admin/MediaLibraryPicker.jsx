import { useEffect, useState } from 'react'
import { fetchMediaAssetById, fetchMediaAssets } from '../../lib/media'
import { createMediaAssetFromUrl, uploadMediaAsset } from '../../lib/storage'
import { STORAGE_FOLDERS } from '../../lib/constants'
import { MediaThumb } from '../MediaDisplay'
import { isYouTubeAsset } from '../../lib/mediaUrls'
import LoadingOverlay from '../LoadingOverlay'

function acceptAllows(accept, kind) {
  if (!accept || accept === '*/*') return true
  return accept.split(',').some((part) => {
    const p = part.trim()
    if (p === '*/*') return true
    if (kind === 'image') return p.startsWith('image/') || p === 'image/*'
    if (kind === 'video') return p.startsWith('video/') || p === 'video/*'
    if (kind === 'audio') return p.startsWith('audio/') || p === 'audio/*'
    return false
  })
}

function friendlyMediaError(err) {
  const msg = err?.message || String(err)
  if (/row-level security|permission denied|42501/i.test(msg)) {
    return 'Could not save media — admin permission denied. Confirm your account has the admin role, then try again.'
  }
  return msg
}

export default function MediaLibraryPicker({
  label = 'Media',
  value,
  onChange,
  previewAsset = null,
  accept = 'image/*,video/*,audio/*',
  folder = STORAGE_FOLDERS.gallery,
}) {
  const [assets, setAssets] = useState([])
  const [current, setCurrent] = useState(previewAsset)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState('')

  const busy = uploading || linking
  const selected = assets.find((a) => a.id === value) || (current?.id === value ? current : null)
  const allowVideo = acceptAllows(accept, 'video')
  const allowImage = acceptAllows(accept, 'image')

  useEffect(() => {
    setCurrent(previewAsset)
  }, [previewAsset])

  useEffect(() => {
    let cancelled = false
    async function loadCurrent() {
      if (!value) {
        setCurrent(null)
        return
      }
      if (previewAsset?.id === value) {
        setCurrent(previewAsset)
        return
      }
      if (current?.id === value) return
      try {
        const asset = await fetchMediaAssetById(value)
        if (!cancelled) setCurrent(asset)
      } catch {
        if (!cancelled) setCurrent(null)
      }
    }
    loadCurrent()
    return () => {
      cancelled = true
    }
  }, [value])

  async function loadAssets() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMediaAssets()
      setAssets(data)
    } catch (err) {
      setError(friendlyMediaError(err))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) loadAssets()
  }, [open])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const asset = await uploadMediaAsset(file, folder)
      setAssets((prev) => [asset, ...prev])
      setCurrent(asset)
      onChange(asset.id, asset)
    } catch (err) {
      setError(friendlyMediaError(err))
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleAddLink() {
    if (!linkUrl.trim() || busy) return
    setLinking(true)
    setError('')
    try {
      const asset = await createMediaAssetFromUrl(linkUrl)
      if (asset.media_type === 'image' && !allowImage) {
        throw new Error('This field only accepts video.')
      }
      if (asset.media_type === 'video' && !allowVideo) {
        throw new Error('This field only accepts images.')
      }
      if (asset.media_type === 'audio' && !acceptAllows(accept, 'audio')) {
        throw new Error('This field does not accept audio.')
      }
      setAssets((prev) => {
        if (prev.some((a) => a.id === asset.id)) return prev
        return [asset, ...prev]
      })
      setCurrent(asset)
      onChange(asset.id, asset)
      setLinkUrl('')
    } catch (err) {
      setError(friendlyMediaError(err))
    }
    setLinking(false)
  }

  function handleSelect(asset) {
    if (busy) return
    setCurrent(asset)
    onChange(asset.id, asset)
    setOpen(false)
  }

  const linkHint = allowVideo && allowImage
    ? 'Paste an image URL or YouTube link'
    : allowVideo
      ? 'Paste a YouTube or video URL'
      : 'Paste an image URL'

  return (
    <div className="media-picker">
      <span className="media-picker-label">{label}</span>

      <div className="media-picker-current">
        {selected ? (
          <MediaThumb asset={selected} />
        ) : (
          <div className="media-picker-empty">No media selected</div>
        )}
        <div className="media-picker-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setOpen(true)}>
            {selected ? 'Change' : 'Choose from library'}
          </button>
          {selected && (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => {
                setCurrent(null)
                onChange(null, null)
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="media-picker-modal" role="dialog" aria-modal="true">
          <div
            className="media-picker-backdrop"
            onClick={() => {
              if (!busy) setOpen(false)
            }}
            aria-hidden="true"
          />
          <div className="media-picker-dialog">
            {(busy || loading) && (
              <LoadingOverlay
                active
                variant="fill"
                label={uploading ? 'Uploading' : linking ? 'Adding link' : 'Loading library'}
              />
            )}

            <div className="media-picker-dialog-header">
              <h3>Media library</h3>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Close
              </button>
            </div>
            <p className="admin-muted">
              Upload a file, or paste a link to an image or YouTube video. Linked media can be reused anywhere.
            </p>

            <div className="media-picker-add-row">
              <label className={`admin-btn admin-btn-primary media-picker-upload${busy ? ' is-disabled' : ''}`}>
                {uploading ? 'Uploading…' : '+ Upload new'}
                <input type="file" accept={accept} onChange={handleUpload} hidden disabled={busy} />
              </label>
            </div>

            {/* Not a <form> — nested forms inside the page editor submit the parent and remount admin */}
            <div className="media-picker-link-form">
              <label>
                Or add by link
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                      handleAddLink()
                    }
                  }}
                  placeholder={linkHint}
                  disabled={busy}
                />
              </label>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-xs"
                disabled={busy || !linkUrl.trim()}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAddLink()
                }}
              >
                {linking ? 'Adding…' : 'Add link'}
              </button>
            </div>

            {error && <p className="admin-error">{error}</p>}

            <div className="media-picker-grid">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className={`media-picker-item${value === asset.id ? ' is-selected' : ''}`}
                  onClick={() => handleSelect(asset)}
                  disabled={busy}
                >
                  <MediaThumb asset={asset} />
                  <span className="media-picker-item-name">
                    {isYouTubeAsset(asset) ? 'YouTube' : asset.file_name || asset.media_type}
                  </span>
                </button>
              ))}
            </div>

            {!loading && !busy && assets.length === 0 && (
              <p className="admin-muted">No media yet. Upload a file or paste a link above.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
