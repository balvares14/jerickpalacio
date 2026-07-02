import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProjectCover from '../components/ProjectCover'
import { projects, SITE_NAME } from '../data/projects'

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
  const [showFixedBackToTop, setShowFixedBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowFixedBackToTop(window.scrollY > window.innerHeight * 0.75)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = (event) => {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToGallery = () => {
    document.getElementById('project-gallery')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <div className="masthead">
        <div className="masthead-contents">
          <div className="masthead-text">
            <h1 className="preserve-whitespace main-text">We&apos;re so glad to have you.</h1>
            <p className="preserve-whitespace main-text">Check out what We&apos;ve got.</p>
            <button type="button" className="masthead-arrow-container" aria-label="Scroll to gallery" onClick={scrollToGallery}>
              <div className="masthead-arrow" />
            </button>
          </div>
        </div>
      </div>

      <div className="site-wrap cfix">
        <div className="site-container">
          <div className="site-content">
            <main>
              <section className="project-covers" id="project-gallery">
                {projects.map((project) => (
                  <ProjectCover key={project.id} project={project} />
                ))}
              </section>

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

              <footer className="site-footer">
                <div className="footer-text">
                  <Link to="/contact">{SITE_NAME}</Link>
                </div>
              </footer>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
