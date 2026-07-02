import { NavLink, useLocation } from 'react-router-dom'
import { SITE_NAME } from '../data/projects'

function NavLinks() {
  const { pathname } = useLocation()
  const workActive = pathname === '/' || pathname === '/work'

  return (
    <nav className="nav-container">
      <div className="gallery-title">
        <NavLink to="/work" className={workActive ? 'active' : undefined}>
          Work
        </NavLink>
      </div>
      <div className="page-title">
        <NavLink to="/contact">Contact Inquiry</NavLink>
      </div>
    </nav>
  )
}

export default function SiteHeader({ onMenuOpen }) {
  return (
    <header className="site-header">
      <NavLinks />
      <div className="logo-wrap">
        <div className="logo logo-text">
          <NavLink to="/contact" className="preserve-whitespace">
            {SITE_NAME}
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
