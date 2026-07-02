export const ADMIN_EMPTY_PLACEHOLDER = '*empty* — click to edit'

function resolvePlaceholder(placeholder, disabled, readOnly) {
  if (disabled || readOnly) return placeholder
  return placeholder ?? ADMIN_EMPTY_PLACEHOLDER
}

export function AdminInput({ placeholder, disabled, readOnly, ...props }) {
  return (
    <input
      placeholder={resolvePlaceholder(placeholder, disabled, readOnly)}
      disabled={disabled}
      readOnly={readOnly}
      {...props}
    />
  )
}

export function AdminTextarea({ placeholder, disabled, readOnly, ...props }) {
  return (
    <textarea
      placeholder={resolvePlaceholder(placeholder, disabled, readOnly)}
      disabled={disabled}
      readOnly={readOnly}
      {...props}
    />
  )
}
