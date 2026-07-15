import { getYouTubeEmbedUrl, getYouTubeThumbnail, isYouTubeAsset } from '../lib/mediaUrls'

export function MediaThumb({ asset, className = 'media-picker-thumb' }) {
  if (!asset) return null

  if (isYouTubeAsset(asset)) {
    const thumb = getYouTubeThumbnail(asset.public_url)
    return (
      <div className={`${className} media-thumb--youtube`}>
        {thumb ? <img src={thumb} alt={asset.alt_text || ''} /> : <span>YouTube</span>}
      </div>
    )
  }

  if (asset.media_type === 'video') {
    return <video src={asset.public_url} className={className} muted playsInline />
  }

  if (asset.media_type === 'audio') {
    return (
      <div className={`${className} media-picker-thumb-audio`}>
        <span>Audio</span>
      </div>
    )
  }

  return <img src={asset.public_url} alt={asset.alt_text || ''} className={className} />
}

/** Renders uploaded video, YouTube embed, or image depending on the asset. */
export function MediaDisplay({
  asset,
  poster,
  className = '',
  alt = '',
  autoplay = false,
  controls = true,
  muted,
  loop,
  playsInline = true,
}) {
  if (!asset?.public_url) return null

  if (isYouTubeAsset(asset)) {
    const embed = getYouTubeEmbedUrl(asset.public_url, { autoplay, mute: autoplay || muted })
    return (
      <div className={`media-youtube-wrap ${className}`.trim()}>
        <iframe
          src={embed}
          title={asset.file_name || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    )
  }

  if (asset.media_type === 'video') {
    return (
      <video
        src={asset.public_url}
        poster={poster?.public_url}
        className={className}
        controls={controls}
        muted={muted ?? autoplay}
        autoPlay={autoplay}
        loop={loop ?? autoplay}
        playsInline={playsInline}
      />
    )
  }

  if (asset.media_type === 'audio') {
    return <audio src={asset.public_url} className={className} controls />
  }

  return <img src={asset.public_url} alt={alt || asset.alt_text || ''} className={className} loading="lazy" />
}
