import { projects as legacyProjects } from '../data/projects'
import { getSupabaseClient } from './supabaseClient'

const WORK_ITEM_SELECT = `*, cover_media:media_assets!cover_media_id (*)`

/**
 * Load work grid items for a home page.
 * Includes orphans (page_id null) and links them to the home page.
 */
export async function loadHomeWorkItems(homePageId) {
  const supabase = getSupabaseClient()

  const { data: linked, error: linkedError } = await supabase
    .from('work_items')
    .select(WORK_ITEM_SELECT)
    .eq('page_id', homePageId)
    .order('sort_order', { ascending: true })

  if (linkedError) throw linkedError

  const { data: orphans, error: orphanError } = await supabase
    .from('work_items')
    .select(WORK_ITEM_SELECT)
    .is('page_id', null)
    .order('sort_order', { ascending: true })

  if (orphanError) throw orphanError

  if (orphans?.length) {
    await supabase.from('work_items').update({ page_id: homePageId }).is('page_id', null)
  }

  const byId = new Map()
  for (const item of [...(linked ?? []), ...(orphans ?? [])]) {
    byId.set(item.id, { ...item, page_id: homePageId })
  }

  return Array.from(byId.values()).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

/**
 * Seed the home work grid from the legacy static projects list.
 * Creates media_assets (external URLs) + work_items + detail pages.
 */
export async function importLegacyWorkGrid(homePageId) {
  const supabase = getSupabaseClient()
  const created = []

  for (let i = 0; i < legacyProjects.length; i++) {
    const project = legacyProjects[i]
    const slug = project.id

    const { data: existing } = await supabase
      .from('work_items')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) continue

    const { data: media, error: mediaError } = await supabase
      .from('media_assets')
      .insert({
        storage_bucket: 'portfolio-media',
        storage_path: `external/legacy/${slug}`,
        public_url: project.image,
        media_type: 'image',
        alt_text: project.title,
        file_name: `${slug}.jpg`,
      })
      .select()
      .single()

    if (mediaError) throw mediaError

    let detailPageId = null
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingPage) {
      detailPageId = existingPage.id
    } else {
      const { data: detailPage, error: pageError } = await supabase
        .from('pages')
        .insert({
          slug,
          title: project.title,
          page_type: 'project',
          template: 'single_column',
          is_published: true,
          page_settings: { show_page_title: true },
        })
        .select('id')
        .single()

      if (pageError) throw pageError
      detailPageId = detailPage.id
    }

    const { data: item, error: itemError } = await supabase
      .from('work_items')
      .insert({
        page_id: homePageId,
        slug,
        title: project.title,
        subtitle: project.date,
        cover_media_id: media.id,
        detail_page_id: detailPageId,
        sort_order: i,
        is_published: true,
      })
      .select(WORK_ITEM_SELECT)
      .single()

    if (itemError) throw itemError
    created.push(item)
  }

  return created
}
