import { useSite } from '../context/SiteContext'
import SiteLogo from './SiteLogo'

export default function SiteFooter() {
  const { settings } = useSite()
  const text = settings.footer_text || settings.logo_text
  const path = settings.footer_link_path || '/contact'

  return (
    <footer className="site-footer">
      <SiteLogo
        text={text}
        path={path}
        media={settings.logo_media}
        layout={settings.footer_logo_layout}
        className="site-logo--footer"
      />
    </footer>
  )
}
