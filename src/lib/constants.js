export const STORAGE_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'portfolio-media'

export const STORAGE_FOLDERS = {
  covers: 'covers',
  gallery: 'gallery',
  logo: 'logo',
  audio: 'audio',
}
