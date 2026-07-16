import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { mergePageSettings } from '../lib/pageTemplates'
import { collectMediaIdsFromBlocks } from '../lib/blockTypes'
import PageContentRenderer from '../components/PageContentRenderer'
import InquiryForm from '../components/InquiryForm'
import SiteFooter from '../components/SiteFooter'
import { useSite } from '../context/SiteContext'
import {
  getContentBlocks,
  getInquiryFormBlock,
  hasVisiblePageContent,
  mergeInquiryFormConfig,
} from '../lib/inquiryFormDefaults'

export default function ContactPage() {
  const { settings: siteSettings } = useSite()
  const [page, setPage] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [mediaMap, setMediaMap] = useState({})
  const [loading, setLoading] = useState(true)

  const contentBlocks = getContentBlocks(blocks)
  const inquiryBlock = getInquiryFormBlock(blocks)
  const formConfig = mergeInquiryFormConfig(inquiryBlock?.content)
  const showPageContent = page && hasVisiblePageContent(page, blocks)

  useEffect(() => {
    document.title = `Contact — ${siteSettings.site_title || siteSettings.logo_text || 'Portfolio'}`

    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false)
        return
      }

      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'contact')
        .eq('is_published', true)
        .maybeSingle()

      if (pageData) {
        setPage({ ...pageData, page_settings: mergePageSettings(pageData.template, pageData.page_settings) })

        const { data: blockData } = await supabase
          .from('page_blocks')
          .select('*')
          .eq('page_id', pageData.id)
          .order('sort_order', { ascending: true })

        setBlocks(blockData ?? [])

        const mediaIds = collectMediaIdsFromBlocks(blockData ?? [])
        if (mediaIds.length) {
          const { data: media } = await supabase.from('media_assets').select('*').in('id', mediaIds)
          const map = {}
          media?.forEach((m) => { map[m.id] = m })
          setMediaMap(map)
        }
      }

      setLoading(false)
    }

    load()
  }, [siteSettings])

  return (
    <div className="site-wrap cfix">
      <div className="site-container">
        <div className="site-content">
          <main className="contact-page">
            {loading && <p className="work-loading">Loading…</p>}

            {!loading && showPageContent && (
              <PageContentRenderer page={page} blocks={contentBlocks} mediaMap={mediaMap} />
            )}

            {!loading && <InquiryForm config={formConfig} />}

            <SiteFooter />
          </main>
        </div>
      </div>
    </div>
  )
}
