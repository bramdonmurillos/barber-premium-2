import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

/**
 * Validate and format a phone number
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @param {string} defaultCountry - Default country code (default: 'MX' for Mexico)
 * @returns {Object} Validation result with formatted number
 */
export function validateAndFormatPhone(phoneNumber, defaultCountry = 'MX') {
  try {
    // Check if the phone number is valid
    if (!isValidPhoneNumber(phoneNumber, defaultCountry)) {
      return {
        isValid: false,
        formatted: null,
        international: null,
        error: 'Número de teléfono inválido'
      }
    }

    // Parse the phone number
    const phone = parsePhoneNumber(phoneNumber, defaultCountry)

    return {
      isValid: true,
      formatted: phone.formatNational(), // National format: (55) 1234 5678
      international: phone.formatInternational(), // International format: +52 55 1234 5678
      e164: phone.format('E.164'), // E.164 format: +525512345678
      countryCode: phone.country,
      number: phone.number,
      error: null
    }
  } catch (error) {
    return {
      isValid: false,
      formatted: null,
      international: null,
      error: 'Error al procesar el número de teléfono'
    }
  }
}

/**
 * Format a phone number for display (national format)
 * 
 * @param {string} phoneNumber - Phone number to format
 * @param {string} defaultCountry - Default country code
 * @returns {string} Formatted phone number or original if invalid
 */
export function formatPhoneNumber(phoneNumber, defaultCountry = 'MX') {
  const result = validateAndFormatPhone(phoneNumber, defaultCountry)
  return result.isValid ? result.formatted : phoneNumber
}

/**
 * Get international format for WhatsApp (without + or spaces)
 * 
 * @param {string} phoneNumber - Phone number
 * @param {string} defaultCountry - Default country code
 * @returns {string} Clean international number for WhatsApp
 */
export function getWhatsAppNumber(phoneNumber, defaultCountry = 'MX') {
  const result = validateAndFormatPhone(phoneNumber, defaultCountry)
  if (result.isValid && result.e164) {
    // Remove the + sign and return just digits
    return result.e164.replace('+', '')
  }
  // Fallback: remove all non-digit characters
  return phoneNumber.replace(/\D/g, '')
}

/**
 * Validate phone number for form input
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhone(phoneNumber) {
  const result = validateAndFormatPhone(phoneNumber)
  return result.isValid
}

/**
 * Clean phone number input (remove formatting, keep only digits and +)
 * 
 * @param {string} phoneNumber - Phone number to clean
 * @returns {string} Cleaned phone number
 */
export function cleanPhoneNumber(phoneNumber) {
  // Keep only digits, +, and spaces for international format
  return phoneNumber.replace(/[^\d+\s]/g, '')
}
