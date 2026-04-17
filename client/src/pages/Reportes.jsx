import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import Layout from '../components/layout/Layout'
import { useCita } from '../contexts/CitaContext'
import { useSede } from '../contexts/SedeContext'
import { useBarbero } from '../contexts/BarberoContext'

export default function Reportes() {
  const { citas } = useCita()
  const { selectedSede } = useSede()
  const { barberos } = useBarbero()
  
  const [selectedPeriod, setSelectedPeriod] = useState('mes-actual')
  const [reportData, setReportData] = useState([])

  useEffect(() => {
    if (citas.length > 0) {
      calculateReports()
    }
  }, [citas, selectedPeriod, barberos])

  const getDateRange = () => {
    const now = new Date()
    
    switch (selectedPeriod) {
      case 'mes-actual':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
      case 'mes-anterior':
        const lastMonth = subMonths(now, 1)
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        }
      case 'todo':
        return {
          start: new Date(2000, 0, 1),
          end: new Date(2100, 11, 31)
        }
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
    }
  }

  const calculateReports = () => {
    const { start, end } = getDateRange()
    
    // Filter completed appointments in date range
    const completedCitas = citas.filter(cita => {
      const citaDate = new Date(cita.fecha_hora)
      return (
        cita.estado === 'completada' &&
        citaDate >= start &&
        citaDate <= end
      )
    })

    // Group by barbero
    const barberoStats = {}

    barberos.forEach(barbero => {
      barberoStats[barbero.id] = {
        barbero: barbero,
        totalCitas: 0,
        totalIngresos: 0,
        servicios: {},
        metodoPago: {
          efectivo: 0,
          tarjeta: 0,
          daviplata: 0,
          nequi: 0,
          transferencia: 0
        }
      }
    })

    completedCitas.forEach(cita => {
      if (!barberoStats[cita.barbero_id]) return

      const stats = barberoStats[cita.barbero_id]
      stats.totalCitas++
      stats.totalIngresos += parseFloat(cita.precio_total || 0)

      // Count services
      const servicioNombre = cita.servicio?.nombre || 'Sin servicio'
      if (!stats.servicios[servicioNombre]) {
        stats.servicios[servicioNombre] = 0
      }
      stats.servicios[servicioNombre]++

      // Count payment methods
      const amount = parseFloat(cita.precio_total || 0)
      if (cita.metodo_pago && stats.metodoPago[cita.metodo_pago] !== undefined) {
        stats.metodoPago[cita.metodo_pago] += amount
      }
    })

    // Convert to array and sort by revenue
    const reportsArray = Object.values(barberoStats)
      .sort((a, b) => b.totalIngresos - a.totalIngresos)

    setReportData(reportsArray)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const getTotalRevenue = () => {
    return reportData.reduce((sum, data) => sum + data.totalIngresos, 0)
  }

  const getTotalAppointments = () => {
    return reportData.reduce((sum, data) => sum + data.totalCitas, 0)
  }

  if (!selectedSede) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Selecciona una sede para ver los reportes</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes de Barberos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Estadísticas y desempeño de {selectedSede.nombre}</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPeriod('mes-actual')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'mes-actual'
                ? 'bg-gold text-black'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Mes Actual
          </button>
          <button
            onClick={() => setSelectedPeriod('mes-anterior')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'mes-anterior'
                ? 'bg-gold text-black'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Mes Anterior
          </button>
          <button
            onClick={() => setSelectedPeriod('todo')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === 'todo'
                ? 'bg-gold text-black'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Todo el Tiempo
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gold mt-1">
                  {formatCurrency(getTotalRevenue())}
                </p>
              </div>
              <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Citas Completadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {getTotalAppointments()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Promedio por Cita</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(getTotalAppointments() > 0 ? getTotalRevenue() / getTotalAppointments() : 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Barberos Reports */}
        {reportData.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sin datos</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No hay citas completadas en el período seleccionado
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reportData.map((data) => (
              <div
                key={data.barbero.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                {/* Barbero Header */}
                <div className="flex items-center space-x-4 mb-6">
                  {data.barbero.foto_url ? (
                    <img
                      src={data.barbero.foto_url}
                      alt={data.barbero.nombre}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-black font-bold text-2xl">
                      {data.barbero.nombre.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{data.barbero.nombre}</h3>
                    {data.barbero.especialidad && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{data.barbero.especialidad}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gold">
                      {formatCurrency(data.totalIngresos)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{data.totalCitas} servicios</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Services Breakdown */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Servicios Realizados
                    </h4>
                    {Object.keys(data.servicios).length === 0 ? (
                      <p className="text-gray-500 text-sm">Sin servicios</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(data.servicios)
                          .sort((a, b) => b[1] - a[1])
                          .map(([servicio, count]) => (
                            <div key={servicio} className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-300 text-sm">{servicio}</span>
                              <span className="text-gray-900 dark:text-white font-semibold">{count}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Métodos de Pago
                    </h4>
                    <div className="space-y-3">
                      {[
                        { key: 'efectivo', label: 'Efectivo', color: 'bg-green-500' },
                        { key: 'tarjeta', label: 'Tarjeta', color: 'bg-blue-500' },
                        { key: 'daviplata', label: 'DaviPlata', color: 'bg-red-500' },
                        { key: 'nequi', label: 'Nequi', color: 'bg-purple-500' },
                        { key: 'transferencia', label: 'Transferencia', color: 'bg-amber-500' },
                      ].map(({ key, label, color }) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 dark:text-gray-300 text-sm">{label}</span>
                            <span className="text-gray-900 dark:text-white font-semibold">
                              {formatCurrency(data.metodoPago[key])}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`${color} h-2 rounded-full`}
                              style={{
                                width: `${data.totalIngresos > 0
                                  ? (data.metodoPago[key] / data.totalIngresos) * 100
                                  : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
