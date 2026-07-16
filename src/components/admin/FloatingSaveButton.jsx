export default function FloatingSaveButton({
  label = 'Save page',
  saving = false,
  disabled = false,
  dirty = false,
  formId,
}) {
  const props = formId ? { type: 'submit', form: formId } : { type: 'button' }
  const idle = !dirty && !saving

  return (
    <div className="floating-save-bar">
      <button
        {...props}
        className={`floating-save-btn${dirty ? ' is-dirty' : ''}${idle ? ' is-idle' : ''}`}
        disabled={disabled || saving || (!dirty && !saving)}
        aria-busy={saving}
      >
        {saving ? 'Saving…' : dirty ? label : 'Saved'}
      </button>
    </div>
  )
}
