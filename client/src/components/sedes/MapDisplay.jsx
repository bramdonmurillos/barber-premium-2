const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/**
 * Displays a sede's location as an embedded Google Map or a fallback link.
 * Uses an embed iframe when API key + coordinates are available;
 * otherwise renders a card with a "Ver en mapa" link.
 *
 * @param {number|null} lat - Latitude
 * @param {number|null} lng - Longitude
 * @param {string} address - Human-readable address (used as fallback)
 * @param {string} className - Optional extra Tailwind classes
 */
export default function MapDisplay({ lat, lng, address, className = '' }) {
  if (!lat && !lng && !address) return null

  const hasCoords = lat != null && lng != null

  // Full embed when we have API key + coords
  if (hasCoords && GOOGLE_MAPS_API_KEY) {
    const embedUrl =
      `https://www.google.com/maps/embed/v1/place` +
      `?key=${GOOGLE_MAPS_API_KEY}` +
      `&q=${lat},${lng}` +
      `&zoom=16`

    return (
      <div className={`rounded-lg overflow-hidden border border-gray-700 ${className}`}>
        <iframe
          title="Ubicación de la sede"
          width="100%"
          height="220"
          style={{ border: 0 }}
          src={embedUrl}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    )
  }

  // Fallback: info card + external link
  const query = hasCoords
    ? `${lat},${lng}`
    : encodeURIComponent(address || '')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

  return (
    <div
      className={`rounded-lg border border-gray-700 bg-gray-900/50 p-4 flex items-center gap-3 ${className}`}
    >
      <svg
        className="w-6 h-6 text-gold shrink-0"
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
      <div className="flex-1 min-w-0">
        {address && (
          <p className="text-white text-sm truncate">{address}</p>
        )}
        {hasCoords && (
          <p className="text-gray-400 text-xs mt-0.5">
            {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          </p>
        )}
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold text-xs font-medium hover:underline shrink-0"
      >
        Ver en mapa
      </a>
    </div>
  )
}
