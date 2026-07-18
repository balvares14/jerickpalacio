import { useEffect, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { mergePageSettings } from '../lib/pageTemplates'
import { projects as fallbackProjects } from '../data/projects'

function mapFallback() {
  return fallbackProjects.map((p, i) => ({
    id: p.id,
    slug: p.id,
    title: p.title,
    subtitle: p.date,
    sort_order: i,
    is_published: true,
    cover_media: { public_url: p.image, media_type: 'image' },
    href: p.href,
  }))
}

const defaultHomeSettings = {
  masthead_enabled: true,
  masthead_title: "We're so glad to have you.",
  masthead_subtitle: "Check out what We've got.",
  masthead_show_arrow: true,
  show_back_to_top: false,
  work_grid_columns: 2,
  show_titles_always: false,
}

export function useHomePage() {
  const [homePage, setHomePage] = useState(null)
  const [settings, setSettings] = useState(defaultHomeSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) setLoading(false)
        return
      }

      let { data: page, error } = await supabase
        .from('pages')
        .select('*')
        .eq('template', 'home')
        .eq('is_published', true)
        .limit(1)
        .maybeSingle()

      if (error) console.error('Home page load error:', error)

      if (!page) {
        const bySlug = await supabase
          .from('pages')
          .select('*')
          .eq('slug', 'work')
          .eq('is_published', true)
          .limit(1)
          .maybeSingle()
        page = bySlug.data
        if (bySlug.error) console.error('Home page slug load error:', bySlug.error)
      }

      if (cancelled) return

      if (page) {
        setHomePage(page)
        setSettings(mergePageSettings('home', page.page_settings))
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { homePage, settings, loading }
}

/**
 * @param {string|null|undefined} homePageId
 * @param {{ homeReady?: boolean }} options - wait until home page query finished before fetching
 */
export function useWorkItems(homePageId, { homeReady = true } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!homeReady) {
      setLoading(true)
      return undefined
    }

    let cancelled = false

    async function load() {
      setLoading(true)

      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) {
          setItems(mapFallback())
          setLoading(false)
        }
        return
      }

      let query = supabase
        .from('work_items')
        .select(
          `
          *,
          cover_media:media_assets!cover_media_id (
            id, public_url, media_type, alt_text
          ),
          cover_poster:media_assets!cover_poster_media_id (
            id, public_url
          )
        `,
        )
        .eq('is_published', true)
        .order('sort_order', { ascending: true })

      if (homePageId) {
        query = query.or(`page_id.eq.${homePageId},page_id.is.null`)
      }

      const { data, error } = await query
      if (cancelled) return

      if (error) {
        console.error('Work items load error:', error)
        setItems(mapFallback())
      } else if (data?.length) {
        setItems(data.map((item) => ({ ...item, href: `/${item.slug}` })))
      } else {
        setItems(mapFallback())
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [homePageId, homeReady])

  return { items, loading }
}

export async function fetchAllWorkItems(pageId) {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('work_items')
    .select(`*, cover_media:media_assets!cover_media_id (*)`)
    .order('sort_order', { ascending: true })

  if (pageId) query = query.eq('page_id', pageId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
