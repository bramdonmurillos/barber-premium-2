import { useState, useEffect } from 'react'
import Modal from '../Modal'
import Input from '../forms/Input'
import Textarea from '../forms/Textarea'
import Toggle from '../forms/Toggle'
import { useServicio } from '../../contexts/ServicioContext'

/**
 * Modal form for creating or editing a servicio
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {object} servicio - Existing servicio data (null for create mode)
 */
export default function ServicioFormModal({ isOpen, onClose, servicio = null }) {
  const { createServicio, updateServicio } = useServicio()
  const isEditMode = Boolean(servicio)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_minutos: '',
    orden: 0,
    activo: true
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load servicio data when editing
  useEffect(() => {
    if (servicio) {
      setFormData({
        nombre: servicio.nombre || '',
        descripcion: servicio.descripcion || '',
        precio: servicio.precio || '',
        duracion_minutos: servicio.duracion_minutos || '',
        orden: servicio.orden || 0,
        activo: servicio.activo ?? true
      })
    } else {
      // Reset form when creating new servicio
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        duracion_minutos: '',
        orden: 0,
        activo: true
      })
    }
    setErrors({})
  }, [servicio, isOpen])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    let parsedValue = value
    
    if (type === 'number') {
      parsedValue = value === '' ? '' : parseFloat(value)
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleToggle = (checked) => {
    setFormData(prev => ({ ...prev, activo: checked }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }

    if (formData.precio === '' || formData.precio < 0) {
      newErrors.precio = 'El precio debe ser mayor o igual a 0'
    }

    if (formData.duracion_minutos === '' || formData.duracion_minutos <= 0) {
      newErrors.duracion_minutos = 'La duración debe ser mayor a 0 minutos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      let result
      if (isEditMode) {
        result = await updateServicio(servicio.id, formData)
      } else {
        result = await createServicio(formData)
      }

      if (result.error) {
        setErrors({ submit: result.error.message })
      } else {
        onClose()
      }
    } catch (error) {
      setErrors({ submit: 'Error al guardar el servicio' })
      console.error('Error saving servicio:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Servicio' : 'Nuevo Servicio'}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Nombre del servicio"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Corte Clásico"
          required
          error={errors.nombre}
          disabled={isSubmitting}
        />

        <Textarea
          label="Descripción"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe el servicio..."
          error={errors.descripcion}
          disabled={isSubmitting}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Precio ($)"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            value={formData.precio}
            onChange={handleChange}
            placeholder="15.00"
            required
            error={errors.precio}
            disabled={isSubmitting}
          />

          <Input
            label="Duración (min)"
            name="duracion_minutos"
            type="number"
            min="1"
            value={formData.duracion_minutos}
            onChange={handleChange}
            placeholder="30"
            required
            error={errors.duracion_minutos}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Orden de visualización"
          name="orden"
          type="number"
          value={formData.orden}
          onChange={handleChange}
          error={errors.orden}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-4">
          Número para ordenar la visualización (menor primero)
        </p>

        <Toggle
          label="Estado"
          checked={formData.activo}
          onChange={handleToggle}
          description={formData.activo ? 'Servicio activo y disponible' : 'Servicio inactivo'}
          disabled={isSubmitting}
        />

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
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Servicio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
