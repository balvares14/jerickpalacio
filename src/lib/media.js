import { getSupabaseClient } from './supabaseClient'

export async function fetchMediaAssets() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchMediaAssetById(id) {
  if (!id) return null
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('media_assets').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
