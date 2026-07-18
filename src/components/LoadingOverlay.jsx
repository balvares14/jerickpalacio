import { useSite } from '../context/SiteContext'

/** Brand mark for loading states — image when available, otherwise logo text. */
function LoadingBrand() {
  const { settings } = useSite()
  const text = settings.logo_text || settings.site_title || 'Loading'
  const imageUrl = settings.logo_media?.public_url

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={text}
        className="loading-overlay-logo-image"
      />
    )
  }

  return <span className="loading-overlay-logo-text preserve-whitespace">{text}</span>
}

/**
 * Logo above a spinner.
 * - fullscreen (default): fixed viewport overlay (stays mounted; toggles via is-active)
 * - fill: covers positioned parent
 * - inline: in-flow centered block (lists / panels)
 */
export default function LoadingOverlay({
  active = true,
  variant = 'fullscreen',
  label = 'Loading',
}) {
  if (variant !== 'fullscreen' && !active) return null

  if (variant === 'fullscreen') {
    return (
      <div
        className={`loading-overlay loading-overlay--fullscreen${active ? ' is-active' : ''}`}
        role="status"
        aria-live="polite"
        aria-busy={active}
        aria-label={label}
        aria-hidden={!active}
      >
        <div className="loading-overlay-inner">
          <LoadingBrand />
          <div className="loading-spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`loading-overlay loading-overlay--${variant}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="loading-overlay-inner">
        <LoadingBrand />
        <div className="loading-spinner" aria-hidden="true" />
      </div>
    </div>
  )
}
