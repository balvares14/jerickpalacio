export const PAGE_TEMPLATES = {
  home: {
    id: 'home',
    label: 'Home',
    description: 'Hero masthead + work project grid',
    routeHint: '/work',
    defaults: {
      masthead_enabled: true,
      masthead_title: "We're so glad to have you.",
      masthead_subtitle: "Check out what We've got.",
      masthead_show_arrow: true,
      show_back_to_top: false,
      work_grid_columns: 2,
    },
  },
  single_column: {
    id: 'single_column',
    label: 'Single column',
    description: 'Full-width content stacked vertically',
    routeHint: '/your-slug',
    defaults: {
      show_page_title: true,
      intro_enabled: false,
      intro_title: '',
      intro_subtitle: '',
      intro_show_arrow: false,
    },
  },
  multi_column: {
    id: 'multi_column',
    label: 'Multi column',
    description: 'Responsive grid of media',
    routeHint: '/your-slug',
    defaults: {
      show_page_title: true,
      grid_columns: 3,
      intro_enabled: false,
      intro_title: '',
      intro_subtitle: '',
    },
  },
  alternating: {
    id: 'alternating',
    label: 'Alternating',
    description: 'Text and media alternating left/right',
    routeHint: '/your-slug',
    defaults: {
      show_page_title: true,
      intro_enabled: true,
      intro_title: '',
      intro_subtitle: '',
      intro_show_arrow: false,
    },
  },
  full_bleed: {
    id: 'full_bleed',
    label: 'Full bleed',
    description: 'Edge-to-edge imagery, minimal text',
    routeHint: '/your-slug',
    defaults: {
      show_page_title: false,
      intro_enabled: false,
      intro_title: '',
      intro_subtitle: '',
    },
  },
  video_gallery: {
    id: 'video_gallery',
    label: 'Video gallery',
    description: 'Featured video with supporting stills',
    routeHint: '/your-slug',
    defaults: {
      show_page_title: true,
      intro_enabled: true,
      intro_title: '',
      intro_subtitle: '',
      intro_show_arrow: false,
    },
  },
}

export const TEMPLATE_LIST = Object.values(PAGE_TEMPLATES)

export function getTemplateDefaults(templateId) {
  return PAGE_TEMPLATES[templateId]?.defaults ?? {}
}

export function mergePageSettings(templateId, pageSettings = {}) {
  return { ...getTemplateDefaults(templateId), ...pageSettings }
}

export function getTemplateLabel(templateId) {
  return PAGE_TEMPLATES[templateId]?.label ?? templateId
}

/** Home/work grid page — by template or reserved slug. */
export function isHomePage(page) {
  return page?.template === 'home' || page?.slug === 'work'
}
