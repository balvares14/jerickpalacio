/** Defaults match current public CSS. */
export const DEFAULT_BACKGROUND_COLOR = '#ffffff'
export const DEFAULT_TEXT_COLOR = '#111111'
export const DEFAULT_FONT_FAMILY = 'work_sans'

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const SITE_FONTS = [
  {
    id: 'work_sans',
    label: 'Work Sans',
    cssFamily: "'Work Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    googleFamily: 'Work+Sans:wght@400;500',
  },
  {
    id: 'cormorant',
    label: 'Cormorant Garamond',
    cssFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    googleFamily: 'Cormorant+Garamond:ital,wght@0,400;0,700;1,400;1,700',
  },
  {
    id: 'eb_garamond',
    label: 'EB Garamond',
    cssFamily: "'EB Garamond', Georgia, 'Times New Roman', serif",
    googleFamily: 'EB+Garamond:ital,wght@0,400;0,600;1,400',
  },
  {
    id: 'libre_baskerville',
    label: 'Libre Baskerville',
    cssFamily: "'Libre Baskerville', Georgia, 'Times New Roman', serif",
    googleFamily: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  },
  {
    id: 'dm_sans',
    label: 'DM Sans',
    cssFamily: "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    googleFamily: 'DM+Sans:ital,wght@0,400;0,500;0,700;1,400',
  },
  {
    id: 'newsreader',
    label: 'Newsreader',
    cssFamily: "'Newsreader', Georgia, 'Times New Roman', serif",
    googleFamily: 'Newsreader:ital,wght@0,400;0,600;1,400',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    cssFamily: "Georgia, 'Times New Roman', Times, serif",
    googleFamily: null,
  },
  {
    id: 'system',
    label: 'System UI',
    cssFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    googleFamily: null,
  },
]

const FONT_IDS = new Set(SITE_FONTS.map((f) => f.id))

export function normalizeHexColor(value, fallback) {
  if (typeof value !== 'string') return fallback
  let hex = value.trim()
  if (!hex) return fallback
  if (!hex.startsWith('#')) hex = `#${hex}`
  if (!HEX_RE.test(hex)) return fallback
  if (hex.length === 4) {
    const [, r, g, b] = hex
    hex = `#${r}${r}${g}${g}${b}${b}`
  }
  return hex.toLowerCase()
}

export function isHexColorSet(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  let hex = value.trim()
  if (!hex.startsWith('#')) hex = `#${hex}`
  return HEX_RE.test(hex)
}

export function normalizeBackgroundColor(value) {
  return normalizeHexColor(value, DEFAULT_BACKGROUND_COLOR)
}

export function normalizeTextColor(value) {
  return normalizeHexColor(value, DEFAULT_TEXT_COLOR)
}

export function isBackgroundColorSet(value) {
  return isHexColorSet(value)
}

export function isTextColorSet(value) {
  return isHexColorSet(value)
}

export function normalizeFontFamily(value) {
  return FONT_IDS.has(value) ? value : DEFAULT_FONT_FAMILY
}

export function isFontFamilySet(value) {
  return typeof value === 'string' && FONT_IDS.has(value)
}

export function getFontMeta(fontId) {
  return SITE_FONTS.find((f) => f.id === fontId) ?? SITE_FONTS[0]
}

export function resolveBackgroundColor(pageColor, siteColor) {
  if (isBackgroundColorSet(pageColor)) return normalizeBackgroundColor(pageColor)
  return normalizeBackgroundColor(siteColor ?? DEFAULT_BACKGROUND_COLOR)
}

export function resolveTextColor(pageColor, siteColor) {
  if (isTextColorSet(pageColor)) return normalizeTextColor(pageColor)
  return normalizeTextColor(siteColor ?? DEFAULT_TEXT_COLOR)
}

export function resolveFontFamily(pageFont, siteFont) {
  if (isFontFamilySet(pageFont)) return normalizeFontFamily(pageFont)
  return normalizeFontFamily(siteFont ?? DEFAULT_FONT_FAMILY)
}

/** Strip inherit keys; normalize set theme values on page_settings. */
export function sanitizeThemePageSettings(settings = {}) {
  const next = { ...settings }

  if (!isBackgroundColorSet(next.background_color)) delete next.background_color
  else next.background_color = normalizeBackgroundColor(next.background_color)

  if (!isTextColorSet(next.text_color)) delete next.text_color
  else next.text_color = normalizeTextColor(next.text_color)

  if (!isFontFamilySet(next.font_family)) delete next.font_family
  else next.font_family = normalizeFontFamily(next.font_family)

  return next
}

export const THEME_PAGE_KEYS = ['background_color', 'text_color', 'font_family']
