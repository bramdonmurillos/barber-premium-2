import { useState, useEffect } from 'react'
import Modal from '../Modal'
import Input from '../forms/Input'
import Textarea from '../forms/Textarea'
import Toggle from '../forms/Toggle'
import PhoneInput from '../forms/PhoneInput'
import ImageUpload from '../forms/ImageUpload'
import HorarioSemanalInput from '../forms/HorarioSemanalInput'
import { generateSlug, isValidSlug } from '../../utils/slugify'
import { useSede } from '../../contexts/SedeContext'
import { deleteImage } from '../../utils/imageUpload'

/**
 * Modal form for creating or editing a sede
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {object} sede - Existing sede data (null for create mode)
 */
export default function SedeFormModal({ isOpen, onClose, sede = null }) {
  const { createSede, updateSede } = useSede()
  const isEditMode = Boolean(sede)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    slug: '',
    activo: true,
    foto_url: '',
    foto_storage_path: '',
    horario_semanal: null
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load sede data when editing
  useEffect(() => {
    if (sede) {
      setFormData({
        nombre: sede.nombre || '',
        descripcion: sede.descripcion || '',
        direccion: sede.direccion || '',
        telefono: sede.telefono || '',
        whatsapp: sede.whatsapp || '',
        slug: sede.slug || '',
        activo: sede.activo ?? true,
        foto_url: sede.foto_url || '',
        foto_storage_path: sede.foto_storage_path || '',
        horario_semanal: sede.horario_semanal || null
      })
    } else {
      // Reset form when creating new sede
      setFormData({
        nombre: '',
        descripcion: '',
        direccion: '',
        telefono: '',
        whatsapp: '',
        slug: '',
        activo: true,
        foto_url: '',
        foto_storage_path: '',
        horario_semanal: null
      })
    }
    setErrors({})
  }, [sede, isOpen])

  // Auto-generate slug from nombre
  useEffect(() => {
    if (!isEditMode && formData.nombre) {
      const generatedSlug = generateSlug(formData.nombre)
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.nombre, isEditMode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleToggle = (checked) => {
    setFormData(prev => ({ ...prev, activo: checked }))
  }

  const handleImageUpload = (publicUrl, storagePath) => {
    setFormData(prev => ({ ...prev, foto_url: publicUrl, foto_storage_path: storagePath }))
  }

  const handleImageDelete = async () => {
    if (formData.foto_storage_path) {
      await deleteImage('sedes-fotos', formData.foto_storage_path)
    }
    setFormData(prev => ({ ...prev, foto_url: '', foto_storage_path: '' }))
  }

  const handleScheduleChange = (newSchedule) => {
    setFormData(prev => ({ ...prev, horario_semanal: newSchedule }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es obligatorio'
    } else if (!isValidSlug(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones'
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
        result = await updateSede(sede.id, formData)
      } else {
        result = await createSede(formData)
      }

      if (result.error) {
        // Check for unique constraint violation
        if (result.error.code === '23505' && result.error.message.includes('slug')) {
          setErrors({ slug: 'Este slug ya está en uso. Elige otro nombre.' })
        } else {
          setErrors({ submit: result.error.message })
        }
      } else {
        onClose()
      }
    } catch (error) {
      setErrors({ submit: 'Error al guardar la sede' })
      console.error('Error saving sede:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Sede' : 'Nueva Sede'}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Nombre de la sede"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej: Barbería Centro"
          required
          error={errors.nombre}
          disabled={isSubmitting}
        />

        <Input
          label="Slug (URL única)"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="barberia-centro"
          required
          error={errors.slug}
          disabled={isSubmitting || isEditMode}
        />
        {!isEditMode && (
          <p className="text-xs text-gray-400 -mt-3 mb-4">
            Se genera automáticamente desde el nombre. Esta será la URL pública de tu sede.
          </p>
        )}

        <Textarea
          label="Descripción"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe tu barbería..."
          error={errors.descripcion}
          disabled={isSubmitting}
          rows={3}
        />

        <Input
          label="Dirección"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          placeholder="Ej: Calle 100 #15-20, Bogotá"
          error={errors.direccion}
          disabled={isSubmitting}
        />

        <PhoneInput
          label="Teléfono"
          value={formData.telefono}
          onChange={(val) => {
            setFormData(prev => ({ ...prev, telefono: val || '' }))
            if (errors.telefono) setErrors(prev => ({ ...prev, telefono: '' }))
          }}
          error={errors.telefono}
          disabled={isSubmitting}
        />

        <PhoneInput
          label="WhatsApp"
          value={formData.whatsapp}
          onChange={(val) => {
            setFormData(prev => ({ ...prev, whatsapp: val || '' }))
            if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: '' }))
          }}
          error={errors.whatsapp}
          disabled={isSubmitting}
        />

        <Toggle
          label="Estado"
          checked={formData.activo}
          onChange={handleToggle}
          description={formData.activo ? 'Sede activa y visible' : 'Sede inactiva'}
          disabled={isSubmitting}
        />

        <ImageUpload
          label="Foto de la sede"
          bucket="sedes-fotos"
          currentImageUrl={formData.foto_url}
          currentStoragePath={formData.foto_storage_path}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          disabled={isSubmitting}
        />

        <HorarioSemanalInput
          label="Horario de atención"
          value={formData.horario_semanal}
          onChange={handleScheduleChange}
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
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Sede'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
