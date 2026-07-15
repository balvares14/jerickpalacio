import { MediaDisplay } from './MediaDisplay'

function MediaImage({ media, alt, className }) {
  if (!media?.public_url) return null
  return <MediaDisplay asset={media} alt={alt} className={className} />
}

function MediaVideo({ media, poster, autoplay, className }) {
  if (!media?.public_url) return null
  return (
    <MediaDisplay
      asset={media}
      poster={poster}
      className={className}
      autoplay={autoplay}
      controls
    />
  )
}

function MediaAudio({ media, title, className }) {
  if (!media?.public_url) return null
  return (
    <div className={className}>
      {title && <p className="content-block-audio-title">{title}</p>}
      <MediaDisplay asset={media} />
    </div>
  )
}

export function ContentBlock({ block, mediaMap, layoutHint }) {
  const c = block.content || {}

  switch (block.block_type) {
    case 'heading': {
      const Tag = `h${c.level || 2}`
      return (
        <Tag className={`content-block content-block-heading content-block-heading--l${c.level || 2}`}>
          {c.text}
        </Tag>
      )
    }
    case 'paragraph':
      return <p className="content-block content-block-paragraph preserve-whitespace">{c.text}</p>
    case 'image':
      return (
        <figure className={`content-block content-block-image${layoutHint === 'full_bleed' ? ' content-block--bleed' : ''}`}>
          <MediaImage media={mediaMap[c.media_id]} alt={c.alt} className="content-block-media" />
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      )
    case 'video':
      return (
        <figure className={`content-block content-block-video${layoutHint === 'full_bleed' ? ' content-block--bleed' : ''}`}>
          <MediaVideo
            media={mediaMap[c.media_id]}
            poster={mediaMap[c.poster_media_id]}
            autoplay={c.autoplay}
            className="content-block-media"
          />
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      )
    case 'audio':
      return (
        <MediaAudio media={mediaMap[c.media_id]} title={c.title} className="content-block content-block-audio" />
      )
    case 'image_row':
      return (
        <div
          className={`content-block content-block-image-row content-block-image-row--cols-${c.columns || 2}`}
        >
          {(c.media_ids || []).map((id) => (
            <MediaImage key={id} media={mediaMap[id]} className="content-block-media" />
          ))}
        </div>
      )
    case 'text_media_split': {
      const mediaEl = mediaMap[c.media_id]?.media_type === 'video' ? (
        <MediaVideo media={mediaMap[c.media_id]} className="content-block-media" />
      ) : (
        <MediaImage media={mediaMap[c.media_id]} className="content-block-media" />
      )
      return (
        <div
          className={`content-block content-block-split content-block-split--${c.media_position || 'left'}`}
        >
          <div className="content-block-split-text preserve-whitespace">{c.text}</div>
          <figure className="content-block-split-media">
            {mediaEl}
            {c.caption && <figcaption>{c.caption}</figcaption>}
          </figure>
        </div>
      )
    }
    case 'spacer':
      return <div className={`content-block content-block-spacer content-block-spacer--${c.size || 'md'}`} aria-hidden="true" />
    case 'inquiry_form':
      return null
    default:
      return null
  }
}

export default function PageContentRenderer({ page, blocks, mediaMap }) {
  const settings = page.page_settings || {}
  const template = page.template

  return (
    <article className={`page-content page-content--${template}`}>
      {settings.show_page_title !== false && template !== 'home' && (
        <header className="page-content-header">
          <h1 className="page-content-title">{page.title}</h1>
        </header>
      )}

      {settings.intro_enabled && (settings.intro_title || settings.intro_subtitle) && (
        <div className="page-intro">
          {settings.intro_title && <h2 className="page-intro-title">{settings.intro_title}</h2>}
          {settings.intro_subtitle && <p className="page-intro-subtitle">{settings.intro_subtitle}</p>}
        </div>
      )}

      <div className={`page-blocks page-blocks--${template}`}>
        {blocks.map((block) => {
          if (template === 'multi_column' && ['image', 'video'].includes(block.block_type)) {
            return (
              <div key={block.id} className="page-blocks-grid-item">
                <ContentBlock block={block} mediaMap={mediaMap} layoutHint={template} />
              </div>
            )
          }
          if (template === 'video_gallery' && block.block_type === 'video') {
            return (
              <div key={block.id} className="page-blocks-featured-video">
                <ContentBlock block={block} mediaMap={mediaMap} layoutHint={template} />
              </div>
            )
          }
          return <ContentBlock key={block.id} block={block} mediaMap={mediaMap} layoutHint={template} />
        })}
      </div>
    </article>
  )
}
