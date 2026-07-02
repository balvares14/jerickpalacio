export const DEFAULT_INQUIRY_FORM = {
  form_title: 'Send an inquiry',
  form_lead: 'Share your email or phone number and a message — no account needed.',
  name_label: 'Name',
  name_optional_text: '(optional)',
  name_placeholder: 'Your name',
  email_label: 'Email',
  email_placeholder: 'you@example.com',
  phone_label: 'Phone',
  phone_placeholder: '(555) 555-5555',
  contact_hint: 'Provide at least one: email or phone.',
  message_label: 'Message',
  message_required_text: '*',
  message_placeholder: 'Tell us about your project or question…',
  submit_label: 'Send inquiry',
  submit_loading_label: 'Sending…',
  success_message: "Thank you — your inquiry was sent. We'll be in touch soon.",
}

export function mergeInquiryFormConfig(content = {}) {
  return { ...DEFAULT_INQUIRY_FORM, ...content }
}

export function isContactPage(page) {
  return page?.page_type === 'contact' || page?.slug === 'contact'
}

export function getContentBlocks(blocks = []) {
  return blocks.filter((b) => b.block_type !== 'inquiry_form')
}

export function getInquiryFormBlock(blocks = []) {
  return blocks.find((b) => b.block_type === 'inquiry_form')
}

export function hasVisiblePageContent(page, blocks = []) {
  const contentBlocks = getContentBlocks(blocks)
  if (contentBlocks.length > 0) return true

  const settings = page?.page_settings || {}
  if (settings.intro_enabled && (settings.intro_title?.trim() || settings.intro_subtitle?.trim())) {
    return true
  }

  return false
}

export const INQUIRY_FORM_FIELDS = [
  { key: 'form_title', label: 'Form title', placeholder: 'Send an inquiry' },
  { key: 'form_lead', label: 'Intro text', textarea: true },
  { key: 'name_label', label: 'Name label' },
  { key: 'name_optional_text', label: 'Name optional hint' },
  { key: 'name_placeholder', label: 'Name placeholder' },
  { key: 'email_label', label: 'Email label' },
  { key: 'email_placeholder', label: 'Email placeholder' },
  { key: 'phone_label', label: 'Phone label' },
  { key: 'phone_placeholder', label: 'Phone placeholder' },
  { key: 'contact_hint', label: 'Email/phone hint' },
  { key: 'message_label', label: 'Message label' },
  { key: 'message_required_text', label: 'Message required marker' },
  { key: 'message_placeholder', label: 'Message placeholder', textarea: true },
  { key: 'submit_label', label: 'Submit button' },
  { key: 'submit_loading_label', label: 'Submit loading text' },
  { key: 'success_message', label: 'Success message', textarea: true },
]
