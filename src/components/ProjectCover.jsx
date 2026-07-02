import { Link } from 'react-router-dom'

export default function ProjectCover({ project }) {
  return (
    <Link className="project-cover hold-space" to={project.href}>
      <div className="cover-content-container">
        <div className="cover-image-wrap">
          <div className="cover-image">
            <div className="cover cover-normal">
              <img
                className="cover__img"
                src={project.image}
                srcSet={project.srcSet}
                sizes="(max-width: 540px) 100vw, (max-width: 768px) 50vw, calc(100vw / 2)"
                alt={project.title}
                loading="lazy"
              />
            </div>
          </div>
        </div>
        <div className="details-wrap">
          <div className="details">
            <div className="details-inner">
              <div className="title preserve-whitespace">{project.title}</div>
              <div className="date">{project.date}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
