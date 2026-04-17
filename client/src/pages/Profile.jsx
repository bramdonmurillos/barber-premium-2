import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Input from '../components/forms/Input'
import PhoneInput from '../components/forms/PhoneInput'

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth()
  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        nombre_completo: profile.nombre_completo || '',
        telefono: profile.telefono || ''
      })
    }
  }, [profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error and success message when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre es obligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id)

      if (error) throw error

      // Recargar el perfil actualizado desde la base de datos
      await fetchProfile(user.id)

      setSuccessMessage('✅ Perfil actualizado correctamente')
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors({ submit: 'Error al actualizar el perfil' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const initials = getInitials(formData.nombre_completo || user?.email)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">
            Administra tu información personal
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-2xl">{initials}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.nombre_completo || 'Sin nombre'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
              <p className="text-gold text-xs mt-2">Cuenta Premium</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={user?.email || ''}
              disabled
            />
            <p className="text-xs text-gray-400 -mt-3 mb-4">
              El email no se puede modificar (asociado a tu cuenta de Google)
            </p>

            <Input
              label="Nombre completo"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
              error={errors.nombre_completo}
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

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {errors.submit}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Información de la Cuenta</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-gray-500 dark:text-gray-400">Cuenta creada</span>
              <span className="text-gray-900 dark:text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
