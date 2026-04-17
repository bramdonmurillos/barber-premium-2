import { useState, useEffect } from 'react'

/**
 * Component for editing weekly schedules (JSONB format)
 * Allows setting work hours for each day of the week
 * 
 * @param {object} value - Current schedule value (JSONB format) with structure:
 *   { lunes: { activo: true, inicio: "09:00", fin: "18:00" }, martes: {...}, ... }
 * @param {function} onChange - Callback when schedule changes (receives entire schedule object)
 * @param {string} label - Label for the input group
 * @param {boolean} disabled - Whether inputs are disabled
 */
export default function HorarioSemanalInput({ value, onChange, label, disabled = false }) {
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  
  // Default schedule: Monday-Saturday 9am-6pm, Sunday closed
  const defaultSchedule = {
    lunes: { activo: true, inicio: '09:00', fin: '18:00' },
    martes: { activo: true, inicio: '09:00', fin: '18:00' },
    miércoles: { activo: true, inicio: '09:00', fin: '18:00' },
    jueves: { activo: true, inicio: '09:00', fin: '18:00' },
    viernes: { activo: true, inicio: '09:00', fin: '18:00' },
    sábado: { activo: true, inicio: '09:00', fin: '18:00' },
    domingo: { activo: false, inicio: '09:00', fin: '18:00' }
  }

  const [horario, setHorario] = useState(value || defaultSchedule)
  const [copyFromDay, setCopyFromDay] = useState('')

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      setHorario(value)
    }
  }, [value])

  const handleDayToggle = (dia) => {
    const nuevoHorario = {
      ...horario,
      [dia]: {
        ...horario[dia],
        activo: !horario[dia].activo
      }
    }
    setHorario(nuevoHorario)
    onChange(nuevoHorario)
  }

  const handleTimeChange = (dia, field, valor) => {
    const nuevoHorario = {
      ...horario,
      [dia]: {
        ...horario[dia],
        [field]: valor
      }
    }
    setHorario(nuevoHorario)
    onChange(nuevoHorario)
  }

  const handleCopySchedule = () => {
    if (!copyFromDay) return
    
    const scheduleTemplate = horario[copyFromDay]
    const nuevoHorario = {}
    
    diasSemana.forEach(dia => {
      nuevoHorario[dia] = {
        ...scheduleTemplate
      }
    })
    
    setHorario(nuevoHorario)
    onChange(nuevoHorario)
    setCopyFromDay('')
  }

  return (
    <div className="mb-6">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          {label}
        </label>
      )}

      {/* Copy schedule helper */}
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          ⚡ Aplicar mismo horario a todos los días:
        </p>
        <div className="flex gap-2">
          <select
            value={copyFromDay}
            onChange={(e) => setCopyFromDay(e.target.value)}
            disabled={disabled}
            className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold disabled:opacity-50"
          >
            <option value="">Seleccionar día modelo...</option>
            {diasSemana.map(dia => (
              <option key={dia} value={dia}>
                {dia.charAt(0).toUpperCase() + dia.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCopySchedule}
            disabled={!copyFromDay || disabled}
            className="px-4 py-2 bg-gold hover:bg-gold-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Daily schedules */}
      <div className="space-y-3">
        {diasSemana.map((dia) => {
          const dayData = horario[dia] || { activo: false, inicio: '09:00', fin: '18:00' }
          
          return (
            <div 
              key={dia} 
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border transition-colors ${
                dayData.activo 
                  ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              {/* Day name + toggle */}
              <div className="flex items-center gap-3 w-full sm:w-32">
                <button
                  type="button"
                  onClick={() => handleDayToggle(dia)}
                  disabled={disabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 disabled:opacity-50 ${
                    dayData.activo ? 'bg-gold' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dayData.activo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium capitalize ${
                  dayData.activo ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                </span>
              </div>

              {/* Time inputs */}
              {dayData.activo ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={dayData.inicio}
                    onChange={(e) => handleTimeChange(dia, 'inicio', e.target.value)}
                    disabled={disabled}
                    className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                  <span className="text-gray-400 dark:text-gray-400 text-sm">a</span>
                  <input
                    type="time"
                    value={dayData.fin}
                    onChange={(e) => handleTimeChange(dia, 'fin', e.target.value)}
                    disabled={disabled}
                    className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>
              ) : (
                <div className="flex-1 text-sm text-gray-500 italic">
                  Cerrado
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        💡 Activa/desactiva cada día y establece horarios de apertura y cierre
      </p>
    </div>
  )
}
