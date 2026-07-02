export default function BlockingErrorOverlay({ title, message }) {
  return (
    <div className="blocking-error-overlay" role="alertdialog" aria-modal="true" aria-labelledby="blocking-error-title">
      <div className="blocking-error-backdrop" aria-hidden="true" />
      <div className="blocking-error-card">
        <h2 id="blocking-error-title" className="blocking-error-title">
          {title}
        </h2>
        <p className="blocking-error-message">{message}</p>
        <p className="blocking-error-reload">
          Reload this page using your browser&apos;s refresh button (or close and reopen the tab), then try again.
        </p>
        <p className="blocking-error-support">
          If the issue persists, contact support or try again later.
        </p>
      </div>
    </div>
  )
}
