import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import ResponsiveNav from './ResponsiveNav'

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="link-transition disable-download">
      <ResponsiveNav open={navOpen} onClose={() => setNavOpen(false)} />
      <SiteHeader onMenuOpen={() => setNavOpen(true)} />
      <div className="header-placeholder" />
      <Outlet />
    </div>
  )
}
