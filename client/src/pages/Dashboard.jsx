import Layout from '../components/layout/Layout'
import { useDashboardStats } from '../hooks/useDashboardStats'

export default function Dashboard() {
  const { totalSedes, citasHoy, barberosActivos, loading } = useDashboardStats()

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Sedes</h3>
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">{loading ? '...' : totalSedes}</p>
          <p className="text-gray-500 text-sm mt-2">Configuradas</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Citas Hoy</h3>
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">{loading ? '...' : citasHoy}</p>
          <p className="text-gray-500 text-sm mt-2">Agendadas</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Barberos Activos</h3>
            <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">{loading ? '...' : barberosActivos}</p>
          <p className="text-gray-500 text-sm mt-2">En todas las sedes</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 lg:mt-8 bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Primeros Pasos</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center shrink-0">
              <span className="text-black font-bold">1</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-gray-900 dark:text-gray-100 font-medium">Crea tu primera sede</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Configura los datos de tu barbería</p>
            </div>
            <button className="w-full sm:w-auto px-4 py-2 bg-gold hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors whitespace-nowrap">
              Crear
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-gray-400 font-bold">2</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-gray-400 font-medium">Agrega barberos</h4>
              <p className="text-gray-500 text-sm">Registra tu equipo de trabajo</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-400 font-bold">3</span>
            </div>
            <div className="flex-1">
              <h4 className="text-gray-400 font-medium">Define tus servicios</h4>
              <p className="text-gray-500 text-sm">Configura el catálogo de servicios</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
