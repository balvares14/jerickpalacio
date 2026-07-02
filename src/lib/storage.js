import { getSupabaseClient } from './supabaseClient'
import { STORAGE_BUCKET, STORAGE_FOLDERS } from './constants'

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

export async function deleteMediaAsset(asset) {
  const supabase = getSupabaseClient()

  const { error: storageError } = await supabase.storage
    .from(asset.storage_bucket || STORAGE_BUCKET)
    .remove([asset.storage_path])

  if (storageError) throw storageError

  const { error } = await supabase.from('media_assets').delete().eq('id', asset.id)
  if (error) throw error
}
