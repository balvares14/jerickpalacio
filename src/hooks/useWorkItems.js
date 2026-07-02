import { useEffect, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured, supabase } from '../lib/supabaseClient'
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

export function useWorkItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        setItems(mapFallback())
        setLoading(false)
        return
      }

      const { data, error } = await supabase
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

      if (error) {
        console.error('Work items load error:', error)
        setItems(mapFallback())
      } else if (data?.length) {
        setItems(
          data.map((item) => ({
            ...item,
            href: `/${item.slug}`,
          })),
        )
      } else {
        setItems([])
      }
      setLoading(false)
    }

    load()
  }, [])

  return { items, loading }
}

export async function fetchAllWorkItems() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('work_items')
    .select(
      `
      *,
      cover_media:media_assets!cover_media_id (*)
    `,
    )
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}
