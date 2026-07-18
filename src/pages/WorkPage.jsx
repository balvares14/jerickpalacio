import { useEffect, useState } from 'react'
import ProjectCover from '../components/ProjectCover'
import SiteFooter from '../components/SiteFooter'
import { useSite } from '../context/SiteContext'
import { usePageLoading } from '../context/RouteLoadingContext'
import { usePageTheme } from '../context/PageBackgroundContext'
import { useHomePage, useWorkItems } from '../hooks/useWorkItems'

function BackToTopIcon() {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 26 26"
      className="icon icon-back-to-top"
      aria-hidden="true"
    >
      <g>
        <path d="M13.8,1.3L21.6,9c0.1,0.1,0.1,0.3,0.2,0.4c0.1,0.1,0.1,0.3,0.1,0.4s0,0.3-0.1,0.4c-0.1,0.1-0.1,0.3-0.3,0.4
          c-0.1,0.1-0.2,0.2-0.4,0.3c-0.2,0.1-0.3,0.1-0.4,0.1c-0.1,0-0.3,0-0.4-0.1c-0.2-0.1-0.3-0.2-0.4-0.3L14.2,5l0,19.1
          c0,0.2-0.1,0.3-0.1,0.5c0,0.1-0.1,0.3-0.3,0.4c-0.1,0.1-0.2,0.2-0.4,0.3c-0.1,0.1-0.3,0.1-0.5,0.1c-0.1,0-0.3,0-0.4-0.1
          c-0.1-0.1-0.3-0.1-0.4-0.3c-0.1-0.1-0.2-0.2-0.3-0.4c-0.1-0.1-0.1-0.3-0.1-0.5l0-19.1l-5.7,5.7C6,10.8,5.8,10.9,5.7,11
          c-0.1,0.1-0.3,0.1-0.4,0.1c-0.2,0-0.3,0-0.4-0.1c-0.1-0.1-0.3-0.2-0.4-0.3c-0.1-0.1-0.1-0.2-0.2-0.4C4.1,10.2,4,10.1,4.1,9.9
          c0-0.1,0-0.3,0.1-0.4c0-0.1,0.1-0.3,0.3-0.4l7.7-7.8c0.1,0,0.2-0.1,0.2-0.1c0,0,0.1-0.1,0.2-0.1c0.1,0,0.2,0,0.2-0.1
          c0.1,0,0.1,0,0.2,0c0,0,0.1,0,0.2,0c0.1,0,0.2,0,0.2,0.1c0.1,0,0.1,0.1,0.2,0.1C13.7,1.2,13.8,1.2,13.8,1.3z" />
      </g>
    </svg>
  )
}

export default function WorkPage() {
  const { settings: siteSettings } = useSite()
  const { homePage, settings: pageSettings, loading: homeLoading } = useHomePage()
  const { items, loading: itemsLoading } = useWorkItems(homePage?.id, { homeReady: !homeLoading })
  const [showFixedBackToTop, setShowFixedBackToTop] = useState(false)

  // Fall back to site_settings masthead if home page row not migrated yet
  const masthead = homePage
    ? pageSettings
    : {
        masthead_enabled: siteSettings.masthead_enabled,
        masthead_title: siteSettings.masthead_title,
        masthead_subtitle: siteSettings.masthead_subtitle,
        masthead_show_arrow: siteSettings.masthead_show_arrow,
        show_back_to_top: false,
        work_grid_columns: siteSettings.work_grid_columns,
        show_titles_always: false,
      }

  const gridClass = [
    'project-covers',
    `project-covers--cols-${masthead.work_grid_columns ?? 2}`,
    masthead.show_titles_always ? 'project-covers--titles-always' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const loading = homeLoading || itemsLoading
  usePageLoading(loading)
  usePageTheme(masthead)

  useEffect(() => {
    document.title = homePage?.title || siteSettings.site_title || siteSettings.logo_text || 'Portfolio'
  }, [homePage, siteSettings])

  useEffect(() => {
    if (!masthead.show_back_to_top) {
      setShowFixedBackToTop(false)
      return undefined
    }
    const onScroll = () => setShowFixedBackToTop(window.scrollY > window.innerHeight * 0.75)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [masthead.show_back_to_top])

  const scrollToTop = (event) => {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToGallery = () => {
    document.getElementById('project-gallery')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {masthead.masthead_enabled && (
        <div className="masthead">
          <div className="masthead-contents">
            <div className="masthead-text">
              <h1 className="preserve-whitespace main-text">{masthead.masthead_title}</h1>
              <p className="preserve-whitespace main-text">{masthead.masthead_subtitle}</p>
              {masthead.masthead_show_arrow && (
                <button
                  type="button"
                  className="masthead-arrow-container"
                  aria-label="Scroll to gallery"
                  onClick={scrollToGallery}
                >
                  <div className="masthead-arrow" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="site-wrap cfix">
        <div className="site-container">
          <div className="site-content">
            <main>
              <section className={gridClass} id="project-gallery">
                {!loading && items.length === 0 && (
                  <p className="work-empty">No published work yet. Add grid items on the Home page in admin.</p>
                )}
                {!loading &&
                  items.map((project) => (
                    <ProjectCover key={project.id} project={project} />
                  ))}
              </section>

              {masthead.show_back_to_top && (
                <>
                  <section className="back-to-top">
                    <a href="#" onClick={scrollToTop}>
                      <span className="arrow">↑</span>
                      <span className="preserve-whitespace">Back to Top</span>
                    </a>
                  </section>

                  <a
                    href="#"
                    className={`back-to-top-fixed${showFixedBackToTop ? ' is-visible' : ''}`}
                    aria-label="Back to top"
                    onClick={scrollToTop}
                  >
                    <BackToTopIcon />
                  </a>
                </>
              )}

              <SiteFooter />
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
