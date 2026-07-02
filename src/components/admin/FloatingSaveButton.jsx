export default function FloatingSaveButton({ label = 'Save page', saving = false, disabled = false, formId }) {
  const props = formId
    ? { type: 'submit', form: formId }
    : { type: 'button' }

  return (
    <button
      {...props}
      className="floating-save-btn"
      disabled={disabled || saving}
      aria-busy={saving}
    >
      {saving ? 'Saving…' : label}
    </button>
  )
}
