import { useState } from 'react'
import Layout from '../components/layout/Layout'
import { useSede } from '../contexts/SedeContext'
import SedeFormModal from '../components/sedes/SedeFormModal'

export default function Sedes() {
  const { sedes, loading, deleteSede } = useSede()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSede, setEditingSede] = useState(null)

  const handleCreate = () => {
    setEditingSede(null)
    setIsModalOpen(true)
  }

  const handleEdit = (sede) => {
    setEditingSede(sede)
    setIsModalOpen(true)
  }

  const handleDelete = async (sede) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar "${sede.nombre}"?\n\nEsto eliminará permanentemente:\n- La sede\n- Todos sus barberos\n- Todos sus servicios\n- Todas sus citas\n\nEsta acción no se puede deshacer.`
    )
    
    if (confirmed) {
      const result = await deleteSede(sede.id)
      if (result.error) {
        alert('Error al eliminar la sede: ' + result.error.message)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSede(null)
  }

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Mis Sedes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">Gestiona tus barberías</p>
          </div>
          <button 
            onClick={handleCreate}
            className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
          >
            + Nueva Sede
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-4">Cargando sedes...</p>
          </div>
        ) : sedes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {sedes.map((sede) => (
              <div key={sede.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gold transition-colors overflow-hidden">
                {/* Sede photo */}
                {sede.foto_url ? (
                  <img
                    src={sede.foto_url}
                    alt={sede.nombre}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <div className="p-4 lg:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{sede.nombre}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full shrink-0 ml-2 ${sede.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {sede.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 truncate">{sede.direccion}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{sede.telefono}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(sede)}
                      className="flex-1 px-3 lg:px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(sede)}
                      className="px-3 lg:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Eliminar sede"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 lg:p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No tienes sedes registradas</h3>
            <p className="text-gray-400 mb-6 text-sm lg:text-base">Crea tu primera sede para empezar a gestionar tu barbería</p>
            <button 
              onClick={handleCreate}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-sm lg:text-base"
            >
              + Crear Primera Sede
            </button>
          </div>
        )}

        {/* Sede Form Modal */}
        <SedeFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          sede={editingSede}
        />
      </div>
    </Layout>
  )
}
