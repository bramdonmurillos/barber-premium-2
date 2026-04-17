import { Switch } from '@headlessui/react'

/**
 * Reusable Toggle/Switch component with premium styling
 * Used for boolean fields like 'activo'
 */
export default function Toggle({ 
  label, 
  name, 
  checked, 
  onChange, 
  disabled = false,
  description,
  ...props 
}) {
  return (
    <div className="mb-4">
      <Switch.Group>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {label && (
              <Switch.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
              </Switch.Label>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <Switch
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`${
              checked ? 'bg-gold' : 'bg-gray-600'
            } relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            {...props}
          >
            <span
              aria-hidden="true"
              className={`${
                checked ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>
      </Switch.Group>
    </div>
  )
}
