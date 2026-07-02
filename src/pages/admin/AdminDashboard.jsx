import { useState } from 'react'
import SiteSettingsPanel from './SiteSettingsPanel'
import NavItemsPanel from './NavItemsPanel'
import WorkItemsPanel from './WorkItemsPanel'

const TABS = [
  { id: 'settings', label: 'Site settings' },
  { id: 'nav', label: 'Navigation' },
  { id: 'work', label: 'Work grid' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('settings')

  return (
    <main className="admin-main">
      <div className="admin-main-inner">
        <h1>Dashboard</h1>
        <p className="admin-muted">Manage the home page and global site content.</p>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-panel">
          {tab === 'settings' && <SiteSettingsPanel />}
          {tab === 'nav' && <NavItemsPanel />}
          {tab === 'work' && <WorkItemsPanel />}
        </div>
      </div>
    </main>
  )
}
