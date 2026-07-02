import { useState } from 'react'
import { submitInquiry } from '../lib/inquiries'
import { mergeInquiryFormConfig } from '../lib/inquiryFormDefaults'

export default function InquiryForm({ config: configProp }) {
  const config = mergeInquiryFormConfig(configProp)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSubmitting(true)

    try {
      await submitInquiry({ name, email, phone, message })
      setSuccess(true)
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="inquiry-form-section">
      <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
        {config.form_title?.trim() && (
          <h2 className="inquiry-form-title">{config.form_title}</h2>
        )}
        {config.form_lead?.trim() && (
          <p className="inquiry-form-lead">{config.form_lead}</p>
        )}

        {error && <p className="inquiry-form-error" role="alert">{error}</p>}
        {success && (
          <p className="inquiry-form-success" role="status">
            {config.success_message}
          </p>
        )}

        <label>
          {config.name_label}
          {config.name_optional_text?.trim() && (
            <span className="inquiry-optional"> {config.name_optional_text}</span>
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder={config.name_placeholder}
          />
        </label>

        <div className="inquiry-form-row">
          <label>
            {config.email_label}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={config.email_placeholder}
            />
          </label>
          <label>
            {config.phone_label}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder={config.phone_placeholder}
            />
          </label>
        </div>
        {config.contact_hint?.trim() && (
          <p className="inquiry-form-hint">{config.contact_hint}</p>
        )}

        <label>
          {config.message_label}
          {config.message_required_text?.trim() && (
            <span className="inquiry-required"> {config.message_required_text}</span>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            required
            placeholder={config.message_placeholder}
          />
        </label>

        <button type="submit" className="inquiry-form-submit" disabled={submitting}>
          {submitting ? config.submit_loading_label : config.submit_label}
        </button>
      </form>
    </section>
  )
}
