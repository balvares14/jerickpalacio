import { supabase, isSupabaseConfigured } from './supabaseClient'

export function validateInquiry({ name, email, phone, message }) {
  const trimmedMessage = message?.trim()
  const trimmedEmail = email?.trim()
  const trimmedPhone = phone?.trim()

  if (!trimmedMessage) {
    return 'Please enter a message.'
  }

  if (!trimmedEmail && !trimmedPhone) {
    return 'Please enter an email or phone number so we can reach you.'
  }

  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Please enter a valid email address.'
  }

  if (trimmedPhone && trimmedPhone.replace(/\D/g, '').length < 7) {
    return 'Please enter a valid phone number.'
  }

  return null
}

export async function submitInquiry({ name, email, phone, message }) {
  const error = validateInquiry({ name, email, phone, message })
  if (error) throw new Error(error)

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Contact form is not configured yet.')
  }

  const payload = {
    name: name?.trim() || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    message: message.trim(),
  }

  const { error: dbError } = await supabase.from('inquiries').insert(payload)
  if (dbError) throw dbError
}
