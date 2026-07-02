import { PAGE_TEMPLATES } from '../../lib/pageTemplates'

function PreviewFrame({ children, label }) {
  return (
    <div className="template-preview">
      <div className="template-preview-chrome">
        <span />
        <span />
      </div>
      <div className="template-preview-body">{children}</div>
      {label && <span className="template-preview-label">{label}</span>}
    </div>
  )
}

function HomePreview({ settings = {} }) {
  const cols = settings.work_grid_columns ?? 2
  return (
    <PreviewFrame label="Home">
      {settings.masthead_enabled !== false && (
        <div className="tp-masthead">
          <div className="tp-line tp-line-lg" />
          <div className="tp-line tp-line-sm" />
        </div>
      )}
      <div className={`tp-grid tp-grid--${cols}`}>
        <div className="tp-cell" />
        <div className="tp-cell" />
        {cols >= 3 && <div className="tp-cell" />}
      </div>
    </PreviewFrame>
  )
}

function SingleColumnPreview({ settings = {} }) {
  return (
    <PreviewFrame label="Single column">
      {settings.intro_enabled && (
        <div className="tp-masthead tp-masthead-sm">
          <div className="tp-line tp-line-md" />
        </div>
      )}
      {settings.show_page_title !== false && <div className="tp-line tp-line-md" />}
      <div className="tp-block tp-block-tall" />
      <div className="tp-block tp-block-tall" />
    </PreviewFrame>
  )
}

function MultiColumnPreview({ settings = {} }) {
  const cols = settings.grid_columns ?? 3
  return (
    <PreviewFrame label="Multi column">
      {settings.show_page_title !== false && <div className="tp-line tp-line-md" />}
      <div className={`tp-grid tp-grid--${Math.min(cols, 3)}`}>
        <div className="tp-cell tp-cell-sm" />
        <div className="tp-cell tp-cell-sm" />
        <div className="tp-cell tp-cell-sm" />
      </div>
    </PreviewFrame>
  )
}

function AlternatingPreview({ settings = {} }) {
  return (
    <PreviewFrame label="Alternating">
      {settings.intro_enabled && (
        <div className="tp-masthead tp-masthead-sm">
          <div className="tp-line tp-line-md" />
        </div>
      )}
      <div className="tp-split">
        <div className="tp-text" />
        <div className="tp-block" />
      </div>
      <div className="tp-split tp-split-reverse">
        <div className="tp-text" />
        <div className="tp-block" />
      </div>
    </PreviewFrame>
  )
}

function FullBleedPreview() {
  return (
    <PreviewFrame label="Full bleed">
      <div className="tp-block tp-block-hero" />
      <div className="tp-block tp-block-hero" />
    </PreviewFrame>
  )
}

function VideoGalleryPreview({ settings = {} }) {
  return (
    <PreviewFrame label="Video gallery">
      {settings.intro_enabled && (
        <div className="tp-masthead tp-masthead-sm">
          <div className="tp-line tp-line-md" />
        </div>
      )}
      <div className="tp-block tp-block-video" />
      <div className="tp-grid tp-grid--2">
        <div className="tp-cell tp-cell-sm" />
        <div className="tp-cell tp-cell-sm" />
      </div>
    </PreviewFrame>
  )
}

const PREVIEW_MAP = {
  home: HomePreview,
  single_column: SingleColumnPreview,
  multi_column: MultiColumnPreview,
  alternating: AlternatingPreview,
  full_bleed: FullBleedPreview,
  video_gallery: VideoGalleryPreview,
}

export default function TemplatePreview({ template, settings, compact }) {
  const Component = PREVIEW_MAP[template] ?? SingleColumnPreview
  const meta = PAGE_TEMPLATES[template]

  return (
    <div className={`template-preview-wrap${compact ? ' template-preview-wrap--compact' : ''}`}>
      <Component settings={settings} />
      {!compact && meta && <p className="admin-muted template-preview-desc">{meta.description}</p>}
    </div>
  )
}

export function TemplatePickerPreview({ template, selected, onSelect, settings }) {
  return (
    <button
      type="button"
      className={`template-picker-card${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(template)}
    >
      <TemplatePreview template={template} settings={settings} compact />
      <span className="template-picker-name">{PAGE_TEMPLATES[template]?.label}</span>
    </button>
  )
}
