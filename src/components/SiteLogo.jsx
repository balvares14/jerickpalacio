import { NavLink } from 'react-router-dom'
import { normalizeLogoLayout } from '../lib/logoLayouts'

/**
 * Renders logo image and/or text based on layout:
 * text_only | image_only | image_left | image_right | image_top
 */
export default function SiteLogo({
  text,
  path = '/',
  media,
  layout = 'text_only',
  className = '',
  linkClassName = '',
  onNavigate,
}) {
  const mode = normalizeLogoLayout(layout)
  const imageUrl = media?.public_url
  const alt = media?.alt_text || text || 'Logo'
  const hasImage = Boolean(imageUrl)
  const showImage = hasImage && mode !== 'text_only'
  const showText = Boolean(text) && (mode !== 'image_only' || !hasImage)

  if (!showImage && !showText) return null

  return (
    <div className={`site-logo site-logo--${mode}${className ? ` ${className}` : ''}`}>
      <NavLink
        to={path}
        className={`site-logo-link${linkClassName ? ` ${linkClassName}` : ''}`}
        onClick={onNavigate}
      >
        {showImage && (
          <img src={imageUrl} alt={alt} className="site-logo-image" />
        )}
        {showText && (
          <span className="site-logo-text preserve-whitespace">{text}</span>
        )}
      </NavLink>
    </div>
  )
}
