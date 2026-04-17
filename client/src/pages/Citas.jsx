import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Layout from '../components/layout/Layout'
import { useCita } from '../contexts/CitaContext'
import { useSede } from '../contexts/SedeContext'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
  { value: 'confirmada', label: 'Confirmada', color: 'green' },
  { value: 'completada', label: 'Completada', color: 'blue' },
  { value: 'cancelada', label: 'Cancelada', color: 'red' }
]

export default function Citas() {
  const { citas, loading, error, updateCita, deleteCita } = useCita()
  const { selectedSede } = useSede()
  
  const [filter, setFilter] = useState('todas')
  const [selectedCita, setSelectedCita] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMetodoPago, setSelectedMetodoPago] = useState(null)

  const filteredCitas = citas.filter(cita => {
    if (filter === 'todas') return true
    return cita.estado === filter
  })

  const handleUpdateStatus = async (citaId, nuevoEstado) => {
    // If marking as completed, ask for payment method
    if (nuevoEstado === 'completada') {
      setShowStatusModal(false)
      setShowPaymentModal(true)
      return
    }
    
    await updateCita(citaId, { estado: nuevoEstado })
    setShowStatusModal(false)
    setSelectedCita(null)
  }

  const handleCompleteWithPayment = async () => {
    if (!selectedMetodoPago) {
      alert('Por favor selecciona un método de pago')
      return
    }

    await updateCita(selectedCita.id, { 
      estado: 'completada',
      metodo_pago: selectedMetodoPago
    })
    
    setShowPaymentModal(false)
    setShowStatusModal(false)
    setSelectedCita(null)
    setSelectedMetodoPago(null)
  }

  const handleDeleteCita = async (citaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta cita?')) {
      await deleteCita(citaId)
    }
  }

  const getEstadoBadge = (estado) => {
    const estadoObj = ESTADOS.find(e => e.value === estado)
    const colors = {
      yellow: 'bg-yellow-900/20 text-yellow-500 border-yellow-600',
      green: 'bg-green-900/20 text-green-500 border-green-600',
      blue: 'bg-blue-900/20 text-blue-500 border-blue-600',
      red: 'bg-red-900/20 text-red-500 border-red-600'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[estadoObj?.color] || colors.yellow}`}>
        {estadoObj?.label || estado}
      </span>
    )
  }

  if (!selectedSede) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Selecciona una sede para ver las citas</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Citas</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Gestiona las reservas de {selectedSede.nombre}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('todas')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === 'todas'
                ? 'bg-gold text-black'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Todas ({citas.length})
          </button>
          {ESTADOS.map(estado => {
            const count = citas.filter(c => c.estado === estado.value).length
            return (
              <button
                key={estado.value}
                onClick={() => setFilter(estado.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filter === estado.value
                    ? 'bg-gold text-black'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {estado.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando citas...</p>
          </div>
        )}

        {/* Citas List */}
        {!loading && filteredCitas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No hay citas</h3>
            <p className="text-gray-400">
              {filter === 'todas' 
                ? 'Aún no hay reservas para esta sede' 
                : `No hay citas con estado "${ESTADOS.find(e => e.value === filter)?.label}"`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCitas.map((cita) => (
              <div
                key={cita.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Cita Info */}
                  <div className="flex-1 space-y-3">
                    {/* Date and Time */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-gold">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">
                          {format(new Date(cita.fecha_hora), "EEE d 'de' MMM", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center text-gold">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">
                          {format(new Date(cita.fecha_hora), 'HH:mm')}
                        </span>
                      </div>
                      {getEstadoBadge(cita.estado)}
                    </div>

                    {/* Cliente Info */}
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-900 dark:text-white font-medium">{cita.cliente_nombre}</span>
                      <span className="text-gray-400">•</span>
                      <a
                        href={`https://wa.me/${cita.cliente_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-400 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        {cita.cliente_whatsapp}
                      </a>
                    </div>

                    {/* Service Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Barbero:</span>
                        <span className="text-gray-900 dark:text-white">{cita.barbero?.nombre || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Servicio:</span>
                        <span className="text-gray-900 dark:text-white">{cita.servicio?.nombre || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Duración:</span>
                        <span className="text-gray-900 dark:text-white">{cita.duracion_minutos} min</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">Precio:</span>
                        <span className="text-gold font-semibold">
                          ${cita.precio_total?.toLocaleString('es-MX') || '0'}
                        </span>
                      </div>
                      {cita.metodo_pago && (
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-2">Pago:</span>
                          <span className="text-gray-900 dark:text-white capitalize">{cita.metodo_pago}</span>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {cita.notas && (
                      <div className="text-sm">
                        <span className="text-gray-400">Notas:</span>
                        <p className="text-gray-300 mt-1">{cita.notas}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCita(cita)
                        setShowStatusModal(true)
                      }}
                      className="flex-1 lg:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cambiar Estado
                    </button>
                    <button
                      onClick={() => handleDeleteCita(cita.id)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && selectedCita && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cambiar Estado de Cita</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Cliente: <span className="text-white">{selectedCita.cliente_nombre}</span>
              </p>
              <div className="space-y-2 mb-6">
                {ESTADOS.map(estado => (
                  <button
                    key={estado.value}
                    onClick={() => handleUpdateStatus(selectedCita.id, estado.value)}
                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                      selectedCita.estado === estado.value
                        ? 'bg-gold text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {estado.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedCita(null)
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Payment Method Modal */}
        {showPaymentModal && selectedCita && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Método de Pago</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                ¿Cómo pagó el cliente <span className="text-white">{selectedCita.cliente_nombre}</span>?
              </p>
              <div className="space-y-3 mb-6">
                {[
                  {
                    value: 'efectivo',
                    label: 'Efectivo',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    ),
                  },
                  {
                    value: 'tarjeta',
                    label: 'Tarjeta',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    ),
                  },
                  {
                    value: 'daviplata',
                    label: 'DaviPlata',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                  {
                    value: 'nequi',
                    label: 'Nequi',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                  {
                    value: 'transferencia',
                    label: 'Transferencia',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    ),
                  },
                ].map((metodo) => (
                  <button
                    key={metodo.value}
                    onClick={() => setSelectedMetodoPago(metodo.value)}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 ${
                      selectedMetodoPago === metodo.value
                        ? 'bg-gold text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {metodo.icon}
                    <span className="text-base">{metodo.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedMetodoPago(null)
                    setShowStatusModal(true)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCompleteWithPayment}
                  disabled={!selectedMetodoPago}
                  className="flex-1 px-4 py-2 bg-gold hover:bg-gold/90 text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Completar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
