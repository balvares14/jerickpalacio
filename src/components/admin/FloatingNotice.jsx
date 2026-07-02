export default function FloatingNotice({
  title,
  message,
  backgroundColor = '#e6f4ea',
  borderColor = '#137333',
  textColor = '#137333',
  dismissOnClick = true,
  onDismiss,
}) {
  function handleClick() {
    if (dismissOnClick && onDismiss) onDismiss()
  }

  function handleKeyDown(e) {
    if (dismissOnClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onDismiss?.()
    }
  }

  return (
    <div
      className="floating-notice"
      role="status"
      aria-live="polite"
      style={{
        backgroundColor,
        borderColor,
        color: textColor,
        cursor: dismissOnClick ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={dismissOnClick ? 0 : -1}
    >
      {title && <p className="floating-notice-title">{title}</p>}
      {message && <p className="floating-notice-message">{message}</p>}
      {dismissOnClick && <span className="floating-notice-hint">Click to dismiss</span>}
    </div>
  )
}
