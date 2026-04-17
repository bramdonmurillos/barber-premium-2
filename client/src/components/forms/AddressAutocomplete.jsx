import { useEffect, useRef, useState } from 'react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * Address autocomplete using Google Places API.
 * Falls back to a plain text input if VITE_GOOGLE_MAPS_API_KEY is not set.
 *
 * @param {string} label - Field label
 * @param {string} value - Current address string
 * @param {function} onChange - Called with { address, lat, lng }
 * @param {string} error - Validation error message
 * @param {boolean} disabled - Whether the field is disabled
 * @param {string} placeholder - Placeholder text
 */
export default function AddressAutocomplete({
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder = 'Buscar dirección...',
}) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [apiLoaded, setApiLoaded] = useState(
    () => Boolean(window.google?.maps?.places)
  )

  // Load Google Maps JS API once
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return
    if (window.google?.maps?.places) {
      setApiLoaded(true)
      return
    }

    const CALLBACK = '__gmapsPlacesLoaded'
    if (!document.getElementById('google-maps-api')) {
      window[CALLBACK] = () => setApiLoaded(true)
      const script = document.createElement('script')
      script.id = 'google-maps-api'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${CALLBACK}`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    } else {
      // Script tag already exists — wait for the callback
      const prev = window[CALLBACK]
      window[CALLBACK] = () => {
        if (prev) prev()
        setApiLoaded(true)
      }
    }
  }, [])

  // Attach Autocomplete once API is ready and input is mounted
  useEffect(() => {
    if (!apiLoaded || !inputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ['address'], fields: ['formatted_address', 'geometry'] }
    )

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (place?.geometry) {
        onChange({
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      }
    })

    return () => {
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
      autocompleteRef.current = null
    }
  }, [apiLoaded, onChange])

  const handleInputChange = (e) => {
    onChange({ address: e.target.value, lat: null, lng: null })
  }

  const inputClass = [
    'w-full px-4 py-2.5 rounded-lg border text-sm transition-colors',
    'bg-gray-900 text-white placeholder-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-gold/50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    error ? 'border-red-500' : 'border-gray-600 focus:border-gold',
  ].join(' ')

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {!GOOGLE_MAPS_API_KEY && (
            <span className="ml-2 text-xs text-amber-400 font-normal">
              (configura VITE_GOOGLE_MAPS_API_KEY para autocompletado)
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
          autoComplete="off"
        />
        {apiLoaded && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
