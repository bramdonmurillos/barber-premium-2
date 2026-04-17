import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Generate a WhatsApp link with booking confirmation message
 * 
 * @param {Object} bookingData - Booking information
 * @param {string} bookingData.sedeWhatsapp - Sede's WhatsApp number
 * @param {string} bookingData.sedeName - Sede's name
 * @param {string} bookingData.barberoName - Barbero's name
 * @param {string} bookingData.servicioName - Service name
 * @param {Date} bookingData.fechaHora - Appointment date and time
 * @param {number} bookingData.precio - Service price
 * @param {string} bookingData.clienteNombre - Client's name
 * @returns {string} WhatsApp link
 */
export function generateWhatsAppLink(bookingData) {
  const {
    sedeWhatsapp,
    sedeName,
    barberoName,
    servicioName,
    fechaHora,
    precio,
    clienteNombre
  } = bookingData

  // Format the date and time
  const formattedDate = format(new Date(fechaHora), "EEEE d 'de' MMMM", { locale: es })
  const formattedTime = format(new Date(fechaHora), 'HH:mm')

  // Create the message
  const message = `¡Hola ${sedeName}!

Soy ${clienteNombre} y me gustaría confirmar mi cita:

👤 Barbero: ${barberoName}
✂️ Servicio: ${servicioName}
📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedTime}
💰 Precio: $${precio.toLocaleString('es-MX')}

¿Está disponible este horario?`

  // Clean the phone number (remove any non-digit characters)
  const cleanPhone = sedeWhatsapp.replace(/\D/g, '')

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)

  // Return the WhatsApp link
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Validate WhatsApp number format
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid WhatsApp number
 */
export function isValidWhatsAppNumber(phone) {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // WhatsApp numbers should have 10-15 digits
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Format phone number for display (Mexican format by default)
 * 
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneForDisplay(phone) {
  const cleaned = phone.replace(/\D/g, '')
  
  // Mexican format: +52 XXX XXX XXXX
  if (cleaned.length === 10) {
    return `+52 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  
  // International format with country code
  if (cleaned.length > 10) {
    return `+${cleaned.slice(0, -10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`
  }
  
  return phone
}
