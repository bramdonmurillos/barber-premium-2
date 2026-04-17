import PhoneInputLib from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

/**
 * International phone number input with country dropdown and E.164 formatting
 *
 * @param {string} label - Field label
 * @param {string} value - Phone value in E.164 format (e.g. +573001234567)
 * @param {function} onChange - Called with E.164 string or undefined
 * @param {string} error - Validation error message
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} placeholder - Placeholder text
 * @param {string} defaultCountry - ISO 3166-1 alpha-2 country code (default: CO)
 */
export default function PhoneInput({
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder = 'Número de teléfono',
  defaultCountry = 'CO',
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <PhoneInputLib
        international
        defaultCountry={defaultCountry}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`phone-input-wrapper ${error ? 'phone-input-error' : ''} ${disabled ? 'phone-input-disabled' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
