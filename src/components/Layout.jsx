import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import ResponsiveNav from './ResponsiveNav'
import SiteFavicon from './SiteFavicon'
import SiteTheme from './SiteTheme'

function pageTransitionKey(pathname) {
  if (pathname === '/' || pathname === '/work') return '/work'
  return pathname
}

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="link-transition disable-download">
      <SiteTheme />
      <SiteFavicon />
      <ResponsiveNav open={navOpen} onClose={() => setNavOpen(false)} />
      <SiteHeader onMenuOpen={() => setNavOpen(true)} />
      <div className="header-placeholder" />
      <div key={pageTransitionKey(location.pathname)} className="page-transition">
        <Outlet />
      </div>
    </div>
  )
}
