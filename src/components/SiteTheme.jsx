import { useEffect } from 'react'
import { useSite } from '../context/SiteContext'
import { usePageThemeContext } from '../context/PageBackgroundContext'
import {
  getFontMeta,
  resolveBackgroundColor,
  resolveFontFamily,
  resolveTextColor,
} from '../lib/siteTheme'

const FONT_LINK_ID = 'site-theme-font'

function ensureGoogleFont(fontId) {
  const meta = getFontMeta(fontId)
  let link = document.getElementById(FONT_LINK_ID)

  if (!meta.googleFamily) {
    if (link) link.remove()
    return
  }

  const href = `https://fonts.googleapis.com/css2?family=${meta.googleFamily}&display=swap`
  if (!link) {
    link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href)
}

/** Applies resolved page/site theme to CSS variables. */
export default function SiteTheme() {
  const { settings } = useSite()
  const { pageTheme } = usePageThemeContext()

  useEffect(() => {
    const bg = resolveBackgroundColor(pageTheme.background_color, settings.background_color)
    const text = resolveTextColor(pageTheme.text_color, settings.text_color)
    const fontId = resolveFontFamily(pageTheme.font_family, settings.font_family)
    const font = getFontMeta(fontId)

    document.documentElement.style.setProperty('--site-bg', bg)
    document.documentElement.style.setProperty('--site-text', text)
    document.documentElement.style.setProperty('--site-font', font.cssFamily)
    ensureGoogleFont(fontId)

    return () => {
      const siteBg = resolveBackgroundColor(null, settings.background_color)
      const siteText = resolveTextColor(null, settings.text_color)
      const siteFontId = resolveFontFamily(null, settings.font_family)
      document.documentElement.style.setProperty('--site-bg', siteBg)
      document.documentElement.style.setProperty('--site-text', siteText)
      document.documentElement.style.setProperty('--site-font', getFontMeta(siteFontId).cssFamily)
      ensureGoogleFont(siteFontId)
    }
  }, [
    pageTheme.background_color,
    pageTheme.text_color,
    pageTheme.font_family,
    settings.background_color,
    settings.text_color,
    settings.font_family,
  ])

  return null
}
