import { useEffect, useRef } from 'react'
import { useSite } from '../context/SiteContext'

const DEFAULT_FAVICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAADUExURUxpcU3H2DoAAAABdFJOUwBA5thmAAAADElEQVQI12NgIA0AAAAwAAHHqoWOAAAAAElFTkSuQmCC"

function ensureIconLink() {
  let link = document.querySelector("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  return link
}

/** Applies logo image as document favicon when enabled in site settings. */
export default function SiteFavicon() {
  const { settings } = useSite()
  const originalHref = useRef(null)

  useEffect(() => {
    const link = ensureIconLink()
    if (originalHref.current == null) {
      originalHref.current = link.getAttribute('href') || DEFAULT_FAVICON
    }

    const useLogo = settings.logo_as_favicon && settings.logo_media?.public_url
    link.href = useLogo ? settings.logo_media.public_url : originalHref.current
  }, [settings.logo_as_favicon, settings.logo_media])

  return null
}
