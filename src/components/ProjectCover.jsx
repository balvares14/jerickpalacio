import { Link } from 'react-router-dom'

export default function ProjectCover({ project }) {
  const media = project.cover_media
  const isVideo = media?.media_type === 'video'
  const src = media?.public_url || project.image
  const poster = project.cover_poster?.public_url

  return (
    <Link className="project-cover hold-space" to={project.href}>
      <div className="cover-content-container">
        <div className="cover-image-wrap">
          <div className="cover-image">
            <div className="cover cover-normal">
              {isVideo ? (
                <video
                  className="cover__img"
                  src={src}
                  poster={poster}
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  className="cover__img"
                  src={src}
                  srcSet={project.srcSet}
                  sizes="(max-width: 540px) 100vw, (max-width: 768px) 50vw, calc(100vw / 2)"
                  alt={project.title}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </div>
        <div className="details-wrap">
          <div className="details">
            <div className="details-inner">
              <div className="title preserve-whitespace">{project.title}</div>
              <div className="date">{project.subtitle ?? project.date}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
