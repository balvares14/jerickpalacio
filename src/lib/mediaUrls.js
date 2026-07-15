/** Extract YouTube video id from common URL shapes. */
export function parseYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const trimmed = url.trim()
    const u = new URL(trimmed)

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }

    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      const embed = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
      if (embed) return embed[1]
    }
  } catch {
    return null
  }
  return null
}

export function isYouTubeUrl(url) {
  return Boolean(parseYouTubeId(url))
}

export function getYouTubeEmbedUrl(urlOrId, { autoplay = false, mute = false } = {}) {
  const id = parseYouTubeId(urlOrId) || urlOrId
  if (!id) return null
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  })
  if (autoplay) params.set('autoplay', '1')
  if (mute || autoplay) params.set('mute', '1')
  return `https://www.youtube.com/embed/${id}?${params.toString()}`
}

export function getYouTubeThumbnail(urlOrId) {
  const id = parseYouTubeId(urlOrId) || urlOrId
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i
const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg)(\?.*)?$/i

export function isLikelyImageUrl(url) {
  if (!url) return false
  try {
    const u = new URL(url.trim())
    if (!/^https?:$/i.test(u.protocol)) return false
    if (isYouTubeUrl(url)) return false
    return IMAGE_EXT.test(u.pathname) || /\/image|img|cdn|photo|media/i.test(u.pathname + u.search)
  } catch {
    return false
  }
}

/**
 * Classify an external URL for media_assets.
 * @returns {{ mediaType: 'image'|'video'|'audio', youtubeId?: string, publicUrl: string, mimeType: string, fileName: string, storagePath: string }}
 */
export function classifyExternalMediaUrl(rawUrl) {
  const url = rawUrl?.trim()
  if (!url) throw new Error('Enter an image or YouTube URL.')

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('That does not look like a valid URL.')
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error('URL must start with http:// or https://')
  }

  const youtubeId = parseYouTubeId(url)
  if (youtubeId) {
    return {
      mediaType: 'video',
      youtubeId,
      publicUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      mimeType: 'video/youtube',
      fileName: `youtube-${youtubeId}`,
      storagePath: `external/youtube/${youtubeId}`,
    }
  }

  if (VIDEO_EXT.test(parsed.pathname)) {
    const name = parsed.pathname.split('/').pop() || 'video.mp4'
    return {
      mediaType: 'video',
      publicUrl: url,
      mimeType: 'video/mp4',
      fileName: decodeURIComponent(name),
      storagePath: `external/video/${crypto.randomUUID()}`,
    }
  }

  if (AUDIO_EXT.test(parsed.pathname)) {
    const name = parsed.pathname.split('/').pop() || 'audio.mp3'
    return {
      mediaType: 'audio',
      publicUrl: url,
      mimeType: 'audio/mpeg',
      fileName: decodeURIComponent(name),
      storagePath: `external/audio/${crypto.randomUUID()}`,
    }
  }

  // Default: treat as image (covers CDN URLs without clear extensions)
  const name = parsed.pathname.split('/').pop() || 'image.jpg'
  return {
    mediaType: 'image',
    publicUrl: url,
    mimeType: IMAGE_EXT.test(parsed.pathname) ? `image/${name.split('.').pop()}` : 'image/jpeg',
    fileName: decodeURIComponent(name).slice(0, 120) || 'linked-image',
    storagePath: `external/image/${crypto.randomUUID()}`,
  }
}

export function isYouTubeAsset(asset) {
  if (!asset) return false
  return asset.mime_type === 'video/youtube' || isYouTubeUrl(asset.public_url)
}

export function isExternalAsset(asset) {
  return Boolean(asset?.storage_path?.startsWith('external/'))
}
