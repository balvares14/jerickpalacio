import { createContext, useContext, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { SITE_NAME } from '../data/projects'

const defaultSettings = {
  logo_text: SITE_NAME,
  logo_link_path: '/contact',
  footer_text: SITE_NAME,
  footer_link_path: '/contact',
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
      supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      supabase
        .from('nav_items')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true }),
    ])

    if (settingsRes.data) setSettings({ ...defaultSettings, ...settingsRes.data })
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
