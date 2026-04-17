import { useState } from 'react'
import Layout from '../components/layout/Layout'
import { useSede } from '../contexts/SedeContext'
import { useBarbero } from '../contexts/BarberoContext'
import BarberoFormModal from '../components/barberos/BarberoFormModal'

export default function Barberos() {
  const { selectedSede } = useSede()
  const { barberos, loading, deleteBarbero } = useBarbero()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBarbero, setEditingBarbero] = useState(null)

  const handleCreate = () => {
    setEditingBarbero(null)
    setIsModalOpen(true)
  }

  const handleEdit = (barbero) => {
    setEditingBarbero(barbero)
    setIsModalOpen(true)
  }

  const handleDelete = async (barbero) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar a "${barbero.nombre}"?\n\nEsta acción no se puede deshacer.`
    )
    
    if (confirmed) {
      const result = await deleteBarbero(barbero.id)
      if (result.error) {
        alert('Error al eliminar el barbero: ' + result.error.message)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBarbero(null)
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
          <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Debes seleccionar una sede para gestionar sus barberos</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Barberos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">
              Gestiona el equipo de <span className="text-gold">{selectedSede.nombre}</span>
            </p>
          </div>
          <button 
            onClick={handleCreate}
            className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-sm lg:text-base whitespace-nowrap"
          >
            + Nuevo Barbero
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Cargando barberos...</p>
          </div>
        ) : barberos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {barberos.map((barbero) => (
              <div key={barbero.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700 hover:border-gold transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gold rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    {barbero.foto_url ? (
                      <img src={barbero.foto_url} alt={barbero.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${barbero.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {barbero.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2">{barbero.nombre}</h3>
                {barbero.especialidad && (
                  <p className="text-gold text-sm mb-2">✂️ {barbero.especialidad}</p>
                )}
                {barbero.instagram && (
                  <a 
                    href={`https://instagram.com/${barbero.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 text-sm mb-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{barbero.instagram}
                  </a>
                )}
                {barbero.descripcion && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{barbero.descripcion}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => handleEdit(barbero)}
                    className="flex-1 px-3 lg:px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(barbero)}
                    className="px-3 lg:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                    title="Eliminar barbero"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No hay barberos en esta sede</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm lg:text-base">Agrega el primer barbero para empezar a gestionar reservas</p>
            <button 
              onClick={handleCreate}
              className="px-4 lg:px-6 py-2 lg:py-3 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors text-sm lg:text-base"
            >
              + Agregar Primer Barbero
            </button>
          </div>
        )}

        {/* Barbero Form Modal */}
        <BarberoFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          barbero={editingBarbero}
        />
      </div>
    </Layout>
  )
}
