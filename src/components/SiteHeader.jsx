import { NavLink, useLocation } from 'react-router-dom'
import { useSite } from '../context/SiteContext'

function isWorkPath(pathname) {
  return pathname === '/' || pathname === '/work'
}

export default function SiteHeader({ onMenuOpen }) {
  const { settings, navItems } = useSite()
  const { pathname } = useLocation()
  const workActive = isWorkPath(pathname)

  const logoText = settings.logo_text || settings.site_title
  const logoPath = settings.logo_link_path || '/contact'

  return (
    <header className="site-header">
      <nav className="nav-container">
        {navItems.map((item) => {
          const active = item.path === '/work' || item.path === '/' ? workActive : pathname === item.path
          return (
            <div
              key={item.id}
              className={item.sort_order === 0 ? 'gallery-title' : 'page-title'}
            >
              <NavLink to={item.path} className={active ? 'active' : undefined}>
                {item.label}
              </NavLink>
            </div>
          )
        })}
      </nav>
      <div className="logo-wrap">
        <div className="logo logo-text">
          <NavLink to={logoPath} className="preserve-whitespace">
            {logoText}
          </NavLink>
        </div>
      </div>
      <div className="social pf-nav-social">
        <ul />
      </div>
      <button
        type="button"
        className="hamburger-click-area"
        aria-label="Open menu"
        onClick={onMenuOpen}
      >
        <div className="hamburger">
          <i />
          <i />
          <i />
        </div>
      </button>
    </header>
  )
}
