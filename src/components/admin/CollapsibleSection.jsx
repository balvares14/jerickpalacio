import { useState } from 'react'

export default function CollapsibleSection({ title, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`admin-collapse${open ? ' is-open' : ''}`}>
      <button type="button" className="admin-collapse-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="admin-collapse-chevron" aria-hidden="true" />
        <span className="admin-collapse-title">{title}</span>
        {!open && summary ? <span className="admin-collapse-summary">{summary}</span> : null}
      </button>
      {open ? <div className="admin-collapse-body">{children}</div> : null}
    </div>
  )
}
