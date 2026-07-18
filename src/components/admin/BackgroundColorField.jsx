import { AdminInput } from './AdminField'
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_COLOR,
  SITE_FONTS,
  getFontMeta,
  isBackgroundColorSet,
  isFontFamilySet,
  isTextColorSet,
  normalizeBackgroundColor,
  normalizeFontFamily,
  normalizeTextColor,
} from '../../lib/siteTheme'

function ColorField({
  value,
  onChange,
  siteDefault,
  allowInherit = false,
  label,
  inheritLabel,
  fallback,
  isSet,
  normalize,
}) {
  const inherit = allowInherit && !isSet(value)
  const pickerValue = normalize(inherit ? siteDefault : value)

  return (
    <div className="admin-theme-field">
      <label className="admin-color-field">
        {label}
        <span className="admin-color-field-row">
          <input
            type="color"
            value={pickerValue}
            disabled={inherit}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} picker`}
          />
          <AdminInput
            value={inherit ? '' : value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={allowInherit ? `Site default (${normalize(siteDefault)})` : fallback}
            disabled={inherit}
          />
        </span>
      </label>
      {allowInherit && (
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={inherit}
            onChange={(e) => onChange(e.target.checked ? null : normalize(siteDefault))}
          />
          {inheritLabel}
        </label>
      )}
    </div>
  )
}

export function BackgroundColorField(props) {
  return (
    <ColorField
      {...props}
      label={props.label ?? 'Background color'}
      inheritLabel="Use site default background"
      fallback={DEFAULT_BACKGROUND_COLOR}
      siteDefault={props.siteDefault ?? DEFAULT_BACKGROUND_COLOR}
      isSet={isBackgroundColorSet}
      normalize={normalizeBackgroundColor}
    />
  )
}

export function TextColorField(props) {
  return (
    <ColorField
      {...props}
      label={props.label ?? 'Text color'}
      inheritLabel="Use site default text color"
      fallback={DEFAULT_TEXT_COLOR}
      siteDefault={props.siteDefault ?? DEFAULT_TEXT_COLOR}
      isSet={isTextColorSet}
      normalize={normalizeTextColor}
    />
  )
}

export function FontFamilyField({
  value,
  onChange,
  siteDefault = DEFAULT_FONT_FAMILY,
  allowInherit = false,
  label = 'Font',
}) {
  const inherit = allowInherit && !isFontFamilySet(value)
  const selectValue = inherit ? '' : normalizeFontFamily(value)
  const previewId = inherit ? normalizeFontFamily(siteDefault) : selectValue

  return (
    <div className="admin-theme-field">
      <label>
        {label}
        <select
          value={selectValue || normalizeFontFamily(siteDefault)}
          disabled={inherit}
          onChange={(e) => onChange(e.target.value)}
        >
          {SITE_FONTS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </label>
      {allowInherit && (
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={inherit}
            onChange={(e) =>
              onChange(e.target.checked ? null : normalizeFontFamily(siteDefault))
            }
          />
          Use site default font
        </label>
      )}
      <p className="admin-muted admin-field-hint admin-font-preview" style={{ fontFamily: getFontMeta(previewId).cssFamily }}>
        Preview — The quick brown fox jumps over the lazy dog.
      </p>
    </div>
  )
}

/** Shared page/site appearance controls. */
export function ThemeAppearanceFields({
  values,
  onChange,
  siteDefaults,
  allowInherit = false,
}) {
  return (
    <div className="admin-theme-appearance">
      <BackgroundColorField
        allowInherit={allowInherit}
        value={values.background_color}
        siteDefault={siteDefaults?.background_color}
        onChange={(v) => onChange('background_color', v)}
        label={allowInherit ? 'Background color' : 'Default background color'}
      />
      <TextColorField
        allowInherit={allowInherit}
        value={values.text_color}
        siteDefault={siteDefaults?.text_color}
        onChange={(v) => onChange('text_color', v)}
        label={allowInherit ? 'Text color' : 'Default text color'}
      />
      <FontFamilyField
        allowInherit={allowInherit}
        value={values.font_family}
        siteDefault={siteDefaults?.font_family}
        onChange={(v) => onChange('font_family', v)}
        label={allowInherit ? 'Font' : 'Default font'}
      />
    </div>
  )
}

export default ThemeAppearanceFields
