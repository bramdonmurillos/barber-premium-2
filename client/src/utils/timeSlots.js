import { format, addMinutes, parse, isAfter, isBefore, isEqual, getDay } from 'date-fns'

/**
 * Generate available time slots for a given date, barbero, and service duration
 * 
 * @param {Date} date - The date to generate slots for
 * @param {number} durationMinutes - Service duration in minutes
 * @param {Array} existingCitas - Array of existing citas for the barbero on that date
 * @param {object} horarioSemanal - Barber's weekly schedule (JSONB format)
 * @param {Array} indisponibilidades - Array of barber's unavailability periods
 * @param {number} slotInterval - Interval between slots in minutes (default: 30)
 * @returns {Array} Array of available time slot strings (HH:mm format)
 */
export function generateTimeSlots(
  date, 
  durationMinutes, 
  existingCitas = [], 
  horarioSemanal = null,
  indisponibilidades = [],
  slotInterval = 30
) {
  const slots = []
  
  // Get day of week (0=Sunday, 1=Monday, etc.)
  const dayOfWeek = getDay(date)
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const dayName = dayNames[dayOfWeek]
  
  // Default business hours: 9:00 AM to 6:00 PM
  let startHour = 9
  let startMinute = 0
  let endHour = 18
  let endMinute = 0
  
  // Use barber's schedule if available
  if (horarioSemanal && horarioSemanal[dayName]) {
    const daySchedule = horarioSemanal[dayName]
    
    // If day is not active, return empty slots
    if (!daySchedule.activo) {
      return []
    }
    
    // Parse start and end times
    if (daySchedule.inicio) {
      const [h, m] = daySchedule.inicio.split(':').map(Number)
      startHour = h
      startMinute = m
    }
    
    if (daySchedule.fin) {
      const [h, m] = daySchedule.fin.split(':').map(Number)
      endHour = h
      endMinute = m
    }
  }
  
  // Generate all possible slots
  let currentTime = new Date(date)
  currentTime.setHours(startHour, startMinute, 0, 0)
  
  const endTime = new Date(date)
  endTime.setHours(endHour, endMinute, 0, 0)
  
  while (currentTime < endTime) {
    // Check if this slot + service duration fits before closing time
    const slotEnd = addMinutes(currentTime, durationMinutes)
    
    if (slotEnd <= endTime) {
      const timeString = format(currentTime, 'HH:mm')
      
      // Check if slot is available (no overlap with existing citas)
      if (isSlotAvailable(currentTime, durationMinutes, existingCitas)) {
        // Check if slot is not blocked by indisponibilidad
        if (isSlotNotBlocked(currentTime, durationMinutes, date, indisponibilidades)) {
          slots.push(timeString)
        }
      }
    }
    
    currentTime = addMinutes(currentTime, slotInterval)
  }
  
  return slots
}

/**
 * Check if a time slot is available (no overlap with existing citas)
 * 
 * @param {Date} slotStart - Start time of the slot to check
 * @param {number} durationMinutes - Duration of the service in minutes
 * @param {Array} existingCitas - Array of existing citas
 * @returns {boolean} True if slot is available, false if occupied
 */
function isSlotAvailable(slotStart, durationMinutes, existingCitas) {
  const slotEnd = addMinutes(slotStart, durationMinutes)
  
  for (const cita of existingCitas) {
    // Skip cancelled citas
    if (cita.estado === 'cancelada') continue
    
    const citaStart = new Date(cita.fecha_hora)
    const citaEnd = addMinutes(citaStart, cita.duracion_minutos)
    
    // Check for overlap:
    // Overlap occurs if slot starts before cita ends AND slot ends after cita starts
    const hasOverlap = isBefore(slotStart, citaEnd) && isAfter(slotEnd, citaStart)
    
    if (hasOverlap) {
      return false
    }
  }
  
  return true
}

/**
 * Check if a time slot is not blocked by barber indisponibilidad
 * 
 * @param {Date} slotStart - Start time of the slot to check
 * @param {number} durationMinutes - Duration of the service in minutes
 * @param {Date} date - The date being checked
 * @param {Array} indisponibilidades - Array of indisponibilidad records
 * @returns {boolean} True if slot is not blocked, false if blocked
 */
function isSlotNotBlocked(slotStart, durationMinutes, date, indisponibilidades) {
  const slotEnd = addMinutes(slotStart, durationMinutes)
  const dateStr = format(date, 'yyyy-MM-dd')
  
  for (const indisponibilidad of indisponibilidades) {
    const fechaInicio = indisponibilidad.fecha_inicio
    const fechaFin = indisponibilidad.fecha_fin
    
    // Check if date is within indisponibilidad date range
    if (dateStr >= fechaInicio && dateStr <= fechaFin) {
      // If it's a full day block, slot is blocked
      if (indisponibilidad.tipo === 'dia_completo') {
        return false
      }
      
      // If it's a time block, check time overlap
      if (indisponibilidad.tipo === 'bloque_horas' && indisponibilidad.hora_inicio && indisponibilidad.hora_fin) {
        const [blockStartH, blockStartM] = indisponibilidad.hora_inicio.split(':').map(Number)
        const [blockEndH, blockEndM] = indisponibilidad.hora_fin.split(':').map(Number)
        
        const blockStart = new Date(date)
        blockStart.setHours(blockStartH, blockStartM, 0, 0)
        
        const blockEnd = new Date(date)
        blockEnd.setHours(blockEndH, blockEndM, 0, 0)
        
        // Check for overlap with indisponibilidad time block
        const hasOverlap = isBefore(slotStart, blockEnd) && isAfter(slotEnd, blockStart)
        
        if (hasOverlap) {
          return false
        }
      }
    }
  }
  
  return true
}

/**
 * Combine date and time strings into a Date object
 * 
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:mm)
 * @returns {Date} Combined Date object
 */
export function combineDateAndTime(dateStr, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  // Parse date parts explicitly to avoid UTC interpretation of 'YYYY-MM-DD' strings
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return date
}

/**
 * Format a Date object to ISO string for database storage
 * 
 * @param {Date} date - Date object
 * @returns {string} ISO string
 */
export function formatForDatabase(date) {
  return date.toISOString()
}

/**
 * Parse time string to minutes past midnight
 * 
 * @param {string} timeStr - Time string (HH:mm)
 * @returns {number} Minutes past midnight
 */
export function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}
