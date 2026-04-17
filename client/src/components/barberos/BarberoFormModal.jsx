import { useState, useEffect } from 'react'
import Modal from '../Modal'
import Input from '../forms/Input'
import Textarea from '../forms/Textarea'
import Toggle from '../forms/Toggle'
import ImageUpload from '../forms/ImageUpload'
import HorarioSemanalInput from '../forms/HorarioSemanalInput'
import { useBarbero } from '../../contexts/BarberoContext'

/**
 * Modal form for creating or editing a barbero
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {object} barbero - Existing barbero data (null for create mode)
 */
export default function BarberoFormModal({ isOpen, onClose, barbero = null }) {
  const { createBarbero, updateBarbero } = useBarbero()
  const isEditMode = Boolean(barbero)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    especialidad: '',
    instagram: '',
    foto_url: '',
    foto_storage_path: '',
    horario_semanal: null,
    orden: 0,
    activo: true
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load barbero data when editing
  useEffect(() => {
    if (barbero) {
      setFormData({
        nombre: barbero.nombre || '',
        descripcion: barbero.descripcion || '',
        especialidad: barbero.especialidad || '',
        instagram: barbero.instagram || '',
        foto_url: barbero.foto_url || '',
        foto_storage_path: barbero.foto_storage_path || '',
        horario_semanal: barbero.horario_semanal || null,
        orden: barbero.orden || 0,
        activo: barbero.activo ?? true
      })
    } else {
      // Reset form when creating new barbero
      setFormData({
        nombre: '',
        descripcion: '',
        especialidad: '',
        instagram: '',
        foto_url: '',
        foto_storage_path: '',
        horario_semanal: null,
        orden: 0,
        activo: true
      })
    }
    setErrors({})
  }, [barbero, isOpen])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleToggle = (checked) => {
    setFormData(prev => ({ ...prev, activo: checked }))
  }

  const handleImageUpload = (publicUrl, storagePath) => {
    setFormData(prev => ({
      ...prev,
      foto_url: publicUrl,
      foto_storage_path: storagePath
    }))
  }

  const handleImageDelete = () => {
    setFormData(prev => ({
      ...prev,
      foto_url: '',
      foto_storage_path: ''
    }))
  }

  const handleScheduleChange = (schedule) => {
    setFormData(prev => ({
      ...prev,
      horario_semanal: schedule
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }

    // Validate Instagram username format (optional field)
    if (formData.instagram.trim()) {
      const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/
      if (!instagramRegex.test(formData.instagram.trim())) {
        newErrors.instagram = 'Usuario de Instagram inválido (solo letras, números, puntos y guiones bajos, máx. 30 caracteres)'
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
      let result
      if (isEditMode) {
        result = await updateBarbero(barbero.id, formData)
      } else {
        result = await createBarbero(formData)
      }

      if (result.error) {
        setErrors({ submit: result.error.message })
      } else {
        onClose()
      }
    } catch (error) {
      setErrors({ submit: 'Error al guardar el barbero' })
      console.error('Error saving barbero:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Barbero' : 'Nuevo Barbero'}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Nombre completo"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
          required
          error={errors.nombre}
          disabled={isSubmitting}
        />

        <Input
          label="Especialidad"
          name="especialidad"
          value={formData.especialidad}
          onChange={handleChange}
          placeholder="Ej: Cortes clásicos, Barba"
          error={errors.especialidad}
          disabled={isSubmitting}
        />

        <Input
          label="Instagram"
          name="instagram"
          value={formData.instagram}
          onChange={handleChange}
          placeholder="nombredeusuario"
          error={errors.instagram}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-4">
          Opcional: Usuario de Instagram (sin @)
        </p>

        <Textarea
          label="Descripción"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Breve descripción del barbero..."
          error={errors.descripcion}
          disabled={isSubmitting}
          rows={3}
        />

        <ImageUpload
          label="Foto de perfil"
          bucket="barberos-fotos"
          currentImageUrl={formData.foto_url}
          currentStoragePath={formData.foto_storage_path}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          disabled={isSubmitting}
        />

        <HorarioSemanalInput
          label="Horario de trabajo"
          value={formData.horario_semanal}
          onChange={handleScheduleChange}
          disabled={isSubmitting}
        />

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
          description={formData.activo ? 'Barbero activo y disponible' : 'Barbero inactivo'}
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
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Barbero'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
