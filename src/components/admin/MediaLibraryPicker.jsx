import { useEffect, useState } from 'react'
import { fetchMediaAssets } from '../../lib/media'
import { uploadMediaAsset } from '../../lib/storage'
import { STORAGE_FOLDERS } from '../../lib/constants'

export default function MediaLibraryPicker({
  label = 'Media',
  value,
  onChange,
  accept = 'image/*,video/*,audio/*',
  folder = STORAGE_FOLDERS.gallery,
}) {
  const [assets, setAssets] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const selected = assets.find((a) => a.id === value)

  async function loadAssets() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMediaAssets()
      setAssets(data)
    } catch (err) {
      setError(err.message)
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
      onChange(asset.id, asset)
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  function handleSelect(asset) {
    onChange(asset.id, asset)
    setOpen(false)
  }

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
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange(null, null)}>
              Clear
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="media-picker-modal" role="dialog" aria-modal="true">
          <div className="media-picker-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="media-picker-dialog">
            <div className="media-picker-dialog-header">
              <h3>Media library</h3>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <p className="admin-muted">
              Uploads are saved to storage and can be reused on any page — no need to re-upload.
            </p>

            <label className="admin-btn admin-btn-primary media-picker-upload">
              {uploading ? 'Uploading…' : '+ Upload new'}
              <input type="file" accept={accept} onChange={handleUpload} hidden disabled={uploading} />
            </label>

            {error && <p className="admin-error">{error}</p>}
            {loading && <p className="admin-muted">Loading library…</p>}

            <div className="media-picker-grid">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className={`media-picker-item${value === asset.id ? ' is-selected' : ''}`}
                  onClick={() => handleSelect(asset)}
                >
                  <MediaThumb asset={asset} />
                  <span className="media-picker-item-name">{asset.file_name || asset.media_type}</span>
                </button>
              ))}
            </div>

            {!loading && assets.length === 0 && (
              <p className="admin-muted">No media yet. Upload your first file above.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MediaThumb({ asset }) {
  if (asset.media_type === 'video') {
    return <video src={asset.public_url} className="media-picker-thumb" muted playsInline />
  }
  if (asset.media_type === 'audio') {
    return (
      <div className="media-picker-thumb media-picker-thumb-audio">
        <span>Audio</span>
      </div>
    )
  }
  return <img src={asset.public_url} alt={asset.alt_text || ''} className="media-picker-thumb" />
}
