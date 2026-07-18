import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { SITE_NAME } from '../data/projects'
import { DEFAULT_LOGO_LAYOUT, normalizeLogoLayout } from '../lib/logoLayouts'
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_COLOR,
  normalizeBackgroundColor,
  normalizeFontFamily,
  normalizeTextColor,
} from '../lib/siteTheme'

const defaultSettings = {
  logo_text: SITE_NAME,
  logo_link_path: '/contact',
  logo_media_id: null,
  logo_media: null,
  logo_layout: DEFAULT_LOGO_LAYOUT,
  footer_text: SITE_NAME,
  footer_link_path: '/contact',
  footer_logo_layout: DEFAULT_LOGO_LAYOUT,
  logo_as_favicon: false,
  background_color: DEFAULT_BACKGROUND_COLOR,
  text_color: DEFAULT_TEXT_COLOR,
  font_family: DEFAULT_FONT_FAMILY,
  masthead_enabled: true,
  masthead_title: "We're so glad to have you.",
  masthead_subtitle: "Check out what We've got.",
  masthead_show_arrow: true,
  work_grid_columns: 2,
  site_title: SITE_NAME,
}

const defaultNav = [
  { id: '1', label: 'Work', path: '/work', sort_order: 0, is_visible: true },
  { id: '2', label: 'Contact Inquiry', path: '/contact', sort_order: 1, is_visible: true },
]

const SITE_SETTINGS_SELECT = `
  *,
  logo_media:media_assets!logo_media_id (
    id,
    public_url,
    alt_text,
    media_type
  )
`

function normalizeSettings(row) {
  if (!row) return { ...defaultSettings }
  const { logo_media, ...rest } = row
  return {
    ...defaultSettings,
    ...rest,
    logo_layout: normalizeLogoLayout(rest.logo_layout),
    footer_logo_layout: normalizeLogoLayout(rest.footer_logo_layout),
    logo_as_favicon: Boolean(rest.logo_as_favicon),
    background_color: normalizeBackgroundColor(rest.background_color),
    text_color: normalizeTextColor(rest.text_color),
    font_family: normalizeFontFamily(rest.font_family),
    logo_media: logo_media ?? null,
  }
}

const SiteContext = createContext(null)

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [navItems, setNavItems] = useState(defaultNav)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  async function refresh() {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    const [settingsRes, navRes] = await Promise.all([
      supabase.from('site_settings').select(SITE_SETTINGS_SELECT).limit(1).maybeSingle(),
      supabase
        .from('nav_items')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true }),
    ])

    if (settingsRes.data) setSettings(normalizeSettings(settingsRes.data))
    if (navRes.data?.length) setNavItems(navRes.data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SiteContext.Provider value={{ settings, navItems, loading, refresh }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used within SiteProvider')
  return ctx
}
