import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import SiteSettingsPanel from './SiteSettingsPanel'
import PagesPanel from './PagesPanel'
import InquiriesPanel from './InquiriesPanel'

const TABS = [
  { id: 'settings', label: 'Site settings' },
  { id: 'pages', label: 'Pages' },
  { id: 'inquiries', label: 'Inquiries' },
]

export default function AdminDashboard() {
  const location = useLocation()
  const initialTab = location.state?.tab === 'pages' ? 'pages' : 'settings'
  const [tab, setTab] = useState(initialTab)

  return (
    <main className="admin-main admin-main--dashboard">
      <div className="admin-dashboard">
        <aside className="admin-sidebar">
          <p className="admin-sidebar-label">Dashboard</p>
          <nav className="admin-sidebar-nav" aria-label="Dashboard sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`admin-sidebar-link${tab === t.id ? ' is-active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-dashboard-content">
          <div className="admin-panel admin-panel--compact">
            {tab === 'settings' && <SiteSettingsPanel />}
            {tab === 'pages' && <PagesPanel />}
            {tab === 'inquiries' && <InquiriesPanel />}
          </div>
        </div>
      </div>
    </main>
  )
}
