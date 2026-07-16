export const LOGO_LAYOUTS = [
  { id: 'text_only', label: 'Text only' },
  { id: 'image_only', label: 'Image only' },
  { id: 'image_left', label: 'Image left of text' },
  { id: 'image_right', label: 'Image right of text' },
  { id: 'image_top', label: 'Image above text' },
]

export const DEFAULT_LOGO_LAYOUT = 'text_only'

export function normalizeLogoLayout(value) {
  return LOGO_LAYOUTS.some((item) => item.id === value) ? value : DEFAULT_LOGO_LAYOUT
}
