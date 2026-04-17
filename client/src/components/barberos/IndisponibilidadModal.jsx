import { useState, useEffect } from 'react'
import Modal from '../Modal'
import Select from '../forms/Select'
import Textarea from '../forms/Textarea'

/**
 * Modal for managing barber unavailability (full days or time blocks)
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSave - Callback when saving unavailability (receives unavailability object)
 * @param {string} barberoNombre - Name of the barber for display
 * @param {object} indisponibilidad - Existing unavailability data (null for create mode)
 */
export default function IndisponibilidadModal({ 
  isOpen, 
  onClose, 
  onSave, 
  barberoNombre,
  indisponibilidad = null 
}) {
  const isEditMode = Boolean(indisponibilidad)

  const [formData, setFormData] = useState({
    tipo: 'dia_completo',
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '',
    hora_fin: '',
    motivo: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load data when editing
  useEffect(() => {
    if (indisponibilidad) {
      setFormData({
        tipo: indisponibilidad.tipo || 'dia_completo',
        fecha_inicio: indisponibilidad.fecha_inicio || '',
        fecha_fin: indisponibilidad.fecha_fin || '',
        hora_inicio: indisponibilidad.hora_inicio || '',
        hora_fin: indisponibilidad.hora_fin || '',
        motivo: indisponibilidad.motivo || ''
      })
    } else {
      // Reset form
      setFormData({
        tipo: 'dia_completo',
        fecha_inicio: '',
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        motivo: ''
      })
    }
    setErrors({})
  }, [indisponibilidad, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es obligatoria'
    }

    if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_inicio > formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la de inicio'
    }

    if (formData.tipo === 'bloque_horas') {
      if (!formData.hora_inicio) {
        newErrors.hora_inicio = 'La hora de inicio es obligatoria para bloques de horas'
      }
      if (!formData.hora_fin) {
        newErrors.hora_fin = 'La hora de fin es obligatoria para bloques de horas'
      }
      if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
        newErrors.hora_fin = 'La hora de fin debe ser posterior a la de inicio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      // Prepare data according to type
      const dataToSave = {
        tipo: formData.tipo,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        motivo: formData.motivo.trim() || null
      }

      // Add time fields only for time blocks
      if (formData.tipo === 'bloque_horas') {
        dataToSave.hora_inicio = formData.hora_inicio
        dataToSave.hora_fin = formData.hora_fin
      } else {
        dataToSave.hora_inicio = null
        dataToSave.hora_fin = null
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      setErrors({ submit: 'Error al guardar la indisponibilidad' })
      console.error('Error saving indisponibilidad:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Indisponibilidad' : 'Nueva Indisponibilidad'}
    >
      <div className="mb-4 p-3 bg-gold/10 border border-gold/30 rounded-lg">
        <p className="text-sm text-gold">
          📅 {barberoNombre}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Registra períodos en los que el barbero no estará disponible para reservas
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Select
          label="Tipo de indisponibilidad"
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          disabled={isSubmitting}
          error={errors.tipo}
        >
          <option value="dia_completo">Día(s) completo(s)</option>
          <option value="bloque_horas">Bloque de horas específico</option>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-4">
          {formData.tipo === 'dia_completo' 
            ? '🔒 El barbero no estará disponible durante todo el día' 
            : '⏰ El barbero no estará disponible solo en este rango de horas'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Fecha inicio <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full bg-white dark:bg-gray-700 border ${
                errors.fecha_inicio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold disabled:opacity-50`}
            />
            {errors.fecha_inicio && (
              <p className="text-red-400 text-sm mt-1">{errors.fecha_inicio}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Fecha fin <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full bg-white dark:bg-gray-700 border ${
                errors.fecha_fin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold disabled:opacity-50`}
            />
            {errors.fecha_fin && (
              <p className="text-red-400 text-sm mt-1">{errors.fecha_fin}</p>
            )}
          </div>
        </div>

        {formData.tipo === 'bloque_horas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Hora inicio <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full bg-white dark:bg-gray-700 border ${
                  errors.hora_inicio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold disabled:opacity-50`}
              />
              {errors.hora_inicio && (
                <p className="text-red-400 text-sm mt-1">{errors.hora_inicio}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Hora fin <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                name="hora_fin"
                value={formData.hora_fin}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full bg-white dark:bg-gray-700 border ${
                  errors.hora_fin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-gold disabled:opacity-50`}
              />
              {errors.hora_fin && (
                <p className="text-red-400 text-sm mt-1">{errors.hora_fin}</p>
              )}
            </div>
          </div>
        )}

        <Textarea
          label="Motivo"
          name="motivo"
          value={formData.motivo}
          onChange={handleChange}
          placeholder="Vacaciones, permiso personal, capacitación, etc."
          error={errors.motivo}
          disabled={isSubmitting}
          rows={3}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-4">
          Opcional: Explica la razón de la indisponibilidad (solo para uso interno)
        </p>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
