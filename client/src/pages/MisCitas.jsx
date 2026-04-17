import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
}

const ESTADO_COLORS = {
  pendiente:  'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
  confirmada: 'bg-green-900/40 text-green-300 border border-green-700',
  completada: 'bg-blue-900/40 text-blue-300 border border-blue-700',
  cancelada:  'bg-gray-700/60 text-gray-400 border border-gray-600',
  no_asistio: 'bg-red-900/40 text-red-300 border border-red-700',
}

export default function MisCitas() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelingId, setCancelingId] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) fetchMisCitas()
  }, [user])

  const fetchMisCitas = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('citas')
        .select(`
          *,
          barbero:barberos(id, nombre, foto_url),
          servicio:servicios(id, nombre, duracion_minutos),
          sede:sedes(id, nombre, slug)
        `)
        .eq('cliente_id', user.id)
        .order('fecha_hora', { ascending: false })

      if (fetchError) throw fetchError
      setCitas(data || [])
    } catch (err) {
      console.error('Error fetching mis citas:', err)
      setError('No se pudieron cargar tus citas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelCita = async (citaId) => {
    try {
      setCancelingId(citaId)

      const { error: updateError } = await supabase
        .from('citas')
        .update({ estado: 'cancelada' })
        .eq('id', citaId)
        .eq('cliente_id', user.id)

      if (updateError) throw updateError

      setCitas(prev =>
        prev.map(c => c.id === citaId ? { ...c, estado: 'cancelada' } : c)
      )
      setConfirmCancel(null)
    } catch (err) {
      console.error('Error canceling cita:', err)
      setError('No se pudo cancelar la cita. Intenta de nuevo.')
    } finally {
      setCancelingId(null)
    }
  }

  const canCancel = (cita) =>
    (cita.estado === 'pendiente' || cita.estado === 'confirmada') &&
    !isPast(parseISO(cita.fecha_hora))

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando tus citas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gold">Mis Citas</h1>
            <p className="text-gray-400 mt-1">Tu historial de reservas</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {citas.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Aún no tienes citas registradas.</p>
            <p className="text-sm text-gray-500">Pide el link de reserva a tu barbería y agenda tu primera cita.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {citas.map((cita) => {
              const fechaHora = parseISO(cita.fecha_hora)
              const pasada = isPast(fechaHora)

              return (
                <div
                  key={cita.id}
                  className={`bg-gray-800 rounded-lg p-5 border ${pasada ? 'border-gray-700 opacity-75' : 'border-gray-600'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Sede + reservar de nuevo */}
                      {cita.sede && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                            {cita.sede.nombre}
                          </p>
                          {cita.sede.slug && (
                            <Link
                              to={`/book/${cita.sede.slug}`}
                              className="text-xs text-gold hover:underline mb-1"
                            >
                              Reservar de nuevo →
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Fecha y hora */}
                      <p className="text-white font-semibold text-lg leading-tight">
                        {format(fechaHora, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                      <p className="text-gold font-medium">
                        {format(fechaHora, 'HH:mm')} hs
                      </p>

                      {/* Barbero y servicio */}
                      <div className="mt-2 text-sm text-gray-400 space-y-0.5">
                        <p>
                          <span className="text-gray-500">Barbero:</span>{' '}
                          <span className="text-gray-300">{cita.barbero?.nombre ?? '—'}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Servicio:</span>{' '}
                          <span className="text-gray-300">{cita.servicio?.nombre ?? '—'}</span>
                          {cita.servicio?.duracion_minutos && (
                            <span className="text-gray-500 ml-1">({cita.servicio.duracion_minutos} min)</span>
                          )}
                        </p>
                        <p>
                          <span className="text-gray-500">Total:</span>{' '}
                          <span className="text-white font-medium">
                            ${Number(cita.precio_total).toLocaleString('es-MX')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Estado badge */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${ESTADO_COLORS[cita.estado] ?? ''}`}>
                        {ESTADO_LABELS[cita.estado] ?? cita.estado}
                      </span>

                      {canCancel(cita) && (
                        confirmCancel === cita.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancelCita(cita.id)}
                              disabled={cancelingId === cita.id}
                              className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              {cancelingId === cita.id ? 'Cancelando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmCancel(null)}
                              className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
                            >
                              Volver
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancel(cita.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Cancelar cita
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
