import { NavLink, useLocation } from 'react-router-dom'
import { SITE_NAME } from '../data/projects'

export default function ResponsiveNav({ open, onClose }) {
  const { pathname } = useLocation()
  const workActive = pathname === '/' || pathname === '/work'

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
          <div className="gallery-title">
            <NavLink to="/work" className={workActive ? 'active' : undefined} onClick={onClose}>
              Work
            </NavLink>
          </div>
          <div className="page-title">
            <NavLink to="/contact" onClick={onClose}>
              Contact Inquiry
            </NavLink>
          </div>
        </nav>
        <div className="social pf-nav-social">
          <ul />
        </div>
        <div className="responsive-nav-logo">
          <NavLink to="/contact" onClick={onClose}>
            {SITE_NAME}
          </NavLink>
        </div>
      </div>
      {open && <button type="button" className="responsive-nav-backdrop" aria-label="Close menu" onClick={onClose} />}
    </div>
  )
}
