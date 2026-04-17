/**
 * Converts text to URL-friendly slug format
 * Example: "Mi Barbería Premium" -> "mi-barberia-premium"
 * 
 * @param {string} text - Input text to convert
 * @returns {string} - URL-safe slug
 */
export function generateSlug(text) {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validates if a string matches the slug format
 * Pattern: lowercase letters, numbers, hyphens only
 * 
 * @param {string} slug - Slug to validate
 * @returns {boolean} - True if valid
 */
export function isValidSlug(slug) {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugPattern.test(slug)
}
