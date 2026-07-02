export const BLOCK_TYPES = {
  heading: {
    label: 'Heading',
    icon: 'H',
    defaultContent: { text: 'Section title', level: 2 },
  },
  paragraph: {
    label: 'Paragraph',
    icon: '¶',
    defaultContent: { text: '' },
  },
  image: {
    label: 'Image',
    icon: '🖼',
    defaultContent: { media_id: null, caption: '', alt: '' },
    mediaField: 'media_id',
  },
  video: {
    label: 'Video',
    icon: '▶',
    defaultContent: { media_id: null, caption: '', autoplay: false, poster_media_id: null },
    mediaField: 'media_id',
  },
  audio: {
    label: 'Audio',
    icon: '♪',
    defaultContent: { media_id: null, title: '' },
    mediaField: 'media_id',
  },
  image_row: {
    label: 'Image row',
    icon: '▦',
    defaultContent: { media_ids: [], columns: 2 },
    mediaFields: 'media_ids',
  },
  text_media_split: {
    label: 'Text + media',
    icon: '⇄',
    defaultContent: { text: '', media_id: null, media_position: 'left', caption: '' },
    mediaField: 'media_id',
  },
  spacer: {
    label: 'Spacer',
    icon: '↕',
    defaultContent: { size: 'md' },
  },
  inquiry_form: {
    label: 'Inquiry form',
    icon: '✉',
    defaultContent: {},
    contactOnly: true,
  },
}

export const BLOCK_TYPE_LIST = Object.entries(BLOCK_TYPES).map(([id, meta]) => ({ id, ...meta }))

export function collectMediaIdsFromBlocks(blocks) {
  const ids = new Set()
  for (const block of blocks) {
    if (block.block_type === 'inquiry_form') continue
    const c = block.content || {}
    if (c.media_id) ids.add(c.media_id)
    if (c.poster_media_id) ids.add(c.poster_media_id)
    if (Array.isArray(c.media_ids)) c.media_ids.forEach((id) => id && ids.add(id))
  }
  return [...ids]
}
