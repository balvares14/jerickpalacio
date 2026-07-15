import { getSupabaseClient } from './supabaseClient'
import { STORAGE_BUCKET, STORAGE_FOLDERS } from './constants'
import { classifyExternalMediaUrl, isExternalAsset } from './mediaUrls'

function inferMediaType(file) {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image'
}

function buildStoragePath(folder, fileName) {
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin'
  return `${folder}/${crypto.randomUUID()}.${ext}`
}

export async function uploadMediaAsset(file, folder = STORAGE_FOLDERS.covers) {
  const supabase = getSupabaseClient()
  const storagePath = buildStoragePath(folder, file.name)
  const mediaType = inferMediaType(file)

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      media_type: mediaType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Register an image or YouTube (or direct video) URL in the media library — no file upload. */
export async function createMediaAssetFromUrl(rawUrl) {
  const supabase = getSupabaseClient()
  const meta = classifyExternalMediaUrl(rawUrl)

  const { data: existing } = await supabase
    .from('media_assets')
    .select('*')
    .eq('public_url', meta.publicUrl)
    .maybeSingle()

  if (existing) return existing

  if (meta.youtubeId) {
    const { data: byPath } = await supabase
      .from('media_assets')
      .select('*')
      .eq('storage_path', meta.storagePath)
      .maybeSingle()
    if (byPath) return byPath
  }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      storage_bucket: STORAGE_BUCKET,
      storage_path: meta.storagePath,
      public_url: meta.publicUrl,
      media_type: meta.mediaType,
      file_name: meta.fileName,
      mime_type: meta.mimeType,
    })
    .select()
    .single()

  if (error) {
    const msg = error.message || ''
    if (/row-level security|permission denied|42501/i.test(msg)) {
      throw new Error(
        'Could not save media — permission denied. Your account may not have the admin role.',
      )
    }
    throw error
  }
  return data
}

export async function deleteMediaAsset(asset) {
  const supabase = getSupabaseClient()

  if (!isExternalAsset(asset)) {
    const { error: storageError } = await supabase.storage
      .from(asset.storage_bucket || STORAGE_BUCKET)
      .remove([asset.storage_path])

    if (storageError) throw storageError
  }

  const { error } = await supabase.from('media_assets').delete().eq('id', asset.id)
  if (error) throw error
}
