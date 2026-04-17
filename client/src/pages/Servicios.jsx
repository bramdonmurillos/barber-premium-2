import { useState } from 'react'
import Layout from '../components/layout/Layout'
import { useSede } from '../contexts/SedeContext'
import { useServicio } from '../contexts/ServicioContext'
import ServicioFormModal from '../components/servicios/ServicioFormModal'

export default function Servicios() {
  const { selectedSede } = useSede()
  const { servicios, loading, deleteServicio } = useServicio()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingServicio, setEditingServicio] = useState(null)

  const handleCreate = () => {
    setEditingServicio(null)
    setIsModalOpen(true)
  }

  const handleEdit = (servicio) => {
    setEditingServicio(servicio)
    setIsModalOpen(true)
  }

  const handleDelete = async (servicio) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar "${servicio.nombre}"?\n\nEsta acción no se puede deshacer.`
    )
    
    if (confirmed) {
      const result = await deleteServicio(servicio.id)
      if (result.error) {
        alert('Error al eliminar el servicio: ' + result.error.message)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingServicio(null)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Show message if no sede is selected
  if (!selectedSede) {
    return (
      <Layout>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 lg:p-12 border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Selecciona una sede primero</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Debes seleccionar una sede para gestionar sus servicios</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Servicios</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">
              Gestiona los servicios de <span className="text-gold">{selectedSede.nombre}</span>
            </p>
          </div>
          <button 
            onClick={handleCreate}
            className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
          >
            + Nuevo Servicio
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Cargando servicios...</p>
          </div>
        ) : servicios.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700 hover:border-gold transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gold rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${servicio.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {servicio.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2">{servicio.nombre}</h3>
                {servicio.descripcion && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{servicio.descripcion}</p>
                )}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-gold text-2xl font-bold">{formatPrice(servicio.precio)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">⏱️ {servicio.duracion_minutos} min</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(servicio)}
                    className="flex-1 px-3 lg:px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(servicio)}
                    className="px-3 lg:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                    title="Eliminar servicio"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 lg:p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No hay servicios en esta sede</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm lg:text-base">Agrega el primer servicio para que los clientes puedan reservar</p>
            <button 
              onClick={handleCreate}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-sm lg:text-base"
            >
              + Agregar Primer Servicio
            </button>
          </div>
        )}

        {/* Servicio Form Modal */}
        <ServicioFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          servicio={editingServicio}
        />
      </div>
    </Layout>
  )
}
