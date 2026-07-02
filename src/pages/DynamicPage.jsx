import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { mergePageSettings } from '../lib/pageTemplates'
import { collectMediaIdsFromBlocks } from '../lib/blockTypes'
import { getContentBlocks, hasVisiblePageContent } from '../lib/inquiryFormDefaults'
import PageContentRenderer from '../components/PageContentRenderer'
import { useSite } from '../context/SiteContext'

export default function DynamicPage() {
  const { slug } = useParams()
  const { settings: siteSettings } = useSite()
  const [page, setPage] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const footerText = siteSettings.footer_text || siteSettings.logo_text
  const footerPath = siteSettings.footer_link_path || '/contact'

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data: pageData, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .neq('template', 'home')
        .maybeSingle()

      if (error || !pageData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setPage({ ...pageData, page_settings: mergePageSettings(pageData.template, pageData.page_settings) })

      const { data: blockData } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', pageData.id)
        .order('sort_order', { ascending: true })

      const contentBlocks = getContentBlocks(blockData ?? [])
      setBlocks(contentBlocks)

      const mediaIds = collectMediaIdsFromBlocks(contentBlocks)
      if (mediaIds.length) {
        const { data: media } = await supabase.from('media_assets').select('*').in('id', mediaIds)
        const map = {}
        media?.forEach((m) => { map[m.id] = m })
        setMediaMap(map)
      }

      document.title = pageData.title
      setLoading(false)
    }

    load()
  }, [slug])

  if (loading) {
    return (
      <div className="site-wrap">
        <p className="work-loading">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="site-wrap">
        <main className="inquiry-page">
          <h1>Page not found</h1>
          <p>
            <Link to="/work">Back to work</Link>
          </p>
        </main>
      </div>
    )
  }

  const showPageContent = page && hasVisiblePageContent(page, blocks)

  return (
    <div className="site-wrap cfix">
      <div className="site-container">
        <div className="site-content">
          <main>
            {showPageContent && (
              <PageContentRenderer page={page} blocks={blocks} mediaMap={mediaMap} />
            )}

            <footer className="site-footer">
              <div className="footer-text">
                <Link to={footerPath}>{footerText}</Link>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
