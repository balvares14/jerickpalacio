import { NavLink, useLocation } from 'react-router-dom'
import { useSite } from '../context/SiteContext'

function isWorkPath(pathname) {
  return pathname === '/' || pathname === '/work'
}

export default function ResponsiveNav({ open, onClose }) {
  const { settings, navItems } = useSite()
  const { pathname } = useLocation()
  const workActive = isWorkPath(pathname)
  const logoText = settings.logo_text || settings.site_title
  const logoPath = settings.logo_link_path || '/contact'

  return (
    <div className={`js-responsive-nav${open ? ' is-open' : ''}`}>
      <div className="responsive-nav has-social">
        <button
          type="button"
          className="close-responsive-click-area"
          aria-label="Close menu"
          onClick={onClose}
        >
          <div className="close-responsive-button" />
        </button>
        <nav className="nav-container">
          {navItems.map((item) => {
            const active = item.path === '/work' || item.path === '/' ? workActive : pathname === item.path
            return (
              <div key={item.id} className={item.sort_order === 0 ? 'gallery-title' : 'page-title'}>
                <NavLink to={item.path} className={active ? 'active' : undefined} onClick={onClose}>
                  {item.label}
                </NavLink>
              </div>
            )
          })}
        </nav>
        <div className="social pf-nav-social">
          <ul />
        </div>
        <div className="responsive-nav-logo">
          <NavLink to={logoPath} onClick={onClose}>
            {logoText}
          </NavLink>
        </div>
      </div>
      {open && <button type="button" className="responsive-nav-backdrop" aria-label="Close menu" onClick={onClose} />}
    </div>
  )
}
