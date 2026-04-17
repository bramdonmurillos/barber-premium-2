import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { isValidPhoneNumber } from 'react-phone-number-input'
import PhoneInput from '../components/forms/PhoneInput'
import { supabase } from '../lib/supabase'
import { generateTimeSlots, combineDateAndTime, formatForDatabase } from '../utils/timeSlots'
import { generateWhatsAppLink } from '../utils/whatsappLink'

const ANY_BARBERO = { id: 'any', nombre: 'Cualquier barbero disponible' }

export default function Booking() {
  const { sedeSlug } = useParams()
  const { user, profile } = useAuth()

  // Multi-step state
  const [step, setStep] = useState(1)
  
  // Sede data
  const [sede, setSede] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Available resources
  const [barberos, setBarberos] = useState([])
  const [servicios, setServicios] = useState([])
  
  // Selected values
  const [selectedBarbero, setSelectedBarbero] = useState(null)
  const [selectedServicio, setSelectedServicio] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteWhatsapp, setClienteWhatsapp] = useState('')
  
  // Time slots
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Form validation
  const [formErrors, setFormErrors] = useState({})

  // Inline submission error (keeps the wizard usable, does not replace the whole page)
  const [submitError, setSubmitError] = useState(null)

  // When 'any barbero' is chosen, this holds the actual assigned barbero after availability check
  const [resolvedBarbero, setResolvedBarbero] = useState(null)

  // Indica que el perfil cargó datos reales (no que el usuario empezó a escribir)
  const [profileDataLoaded, setProfileDataLoaded] = useState(false)

  // Pre-fill contact data from profile when user is authenticated
  useEffect(() => {
    if (user && profile) {
      let loaded = false
      if (profile.nombre_completo) { setClienteNombre(profile.nombre_completo); loaded = true }
      if (profile.telefono) { setClienteWhatsapp(profile.telefono); loaded = true }
      setProfileDataLoaded(loaded)
    }
  }, [user, profile])

  // Fetch sede data by slug
  useEffect(() => {
    fetchSedeData()
  }, [sedeSlug])

  const fetchSedeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch sede
      const { data: sedeData, error: sedeError } = await supabase
        .from('sedes')
        .select('*')
        .eq('slug', sedeSlug)
        .eq('activo', true)
        .single()

      if (sedeError) throw new Error('Sede no encontrada')
      setSede(sedeData)

      // Fetch active barberos
      const { data: barberosData, error: barberosError } = await supabase
        .from('barberos')
        .select('*')
        .eq('sede_id', sedeData.id)
        .eq('activo', true)
        .order('nombre')

      if (barberosError) throw barberosError
      setBarberos(barberosData || [])

      // Fetch active servicios
      const { data: serviciosData, error: serviciosError } = await supabase
        .from('servicios')
        .select('*')
        .eq('sede_id', sedeData.id)
        .eq('activo', true)
        .order('nombre')

      if (serviciosError) throw serviciosError
      setServicios(serviciosData || [])
    } catch (err) {
      console.error('Error fetching sede data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch available time slots when barbero, servicio, or date changes
  useEffect(() => {
    if (selectedBarbero && selectedServicio && selectedDate) {
      fetchAvailableTimeSlots()
    }
  }, [selectedBarbero, selectedServicio, selectedDate])

  const fetchSlotsForBarbero = async (barbero, startOfDay, endOfDay, dateStr) => {
    const { data: citas } = await supabase
      .from('citas')
      .select('id, barbero_id, fecha_hora, duracion_minutos, estado')
      .eq('barbero_id', barbero.id)
      .gte('fecha_hora', startOfDay.toISOString())
      .lte('fecha_hora', endOfDay.toISOString())
      .in('estado', ['pendiente', 'confirmada'])

    const { data: indisponibilidades } = await supabase
      .from('barbero_indisponibilidad')
      .select('*')
      .eq('barbero_id', barbero.id)
      .lte('fecha_inicio', dateStr)
      .gte('fecha_fin', dateStr)

    return generateTimeSlots(
      selectedDate,
      selectedServicio.duracion_minutos,
      citas || [],
      barbero.horario_semanal || null,
      indisponibilidades || []
    )
  }

  const fetchAvailableTimeSlots = async () => {
    try {
      setLoadingSlots(true)
      setResolvedBarbero(null)

      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      if (selectedBarbero.id === 'any') {
        // Find the barbero with the most available slots
        let bestBarbero = null
        let bestSlots = []

        for (const barbero of barberos) {
          const slots = await fetchSlotsForBarbero(barbero, startOfDay, endOfDay, dateStr)
          if (slots.length > bestSlots.length) {
            bestSlots = slots
            bestBarbero = barbero
          }
        }

        setResolvedBarbero(bestBarbero)
        setAvailableTimeSlots(bestSlots)
      } else {
        const slots = await fetchSlotsForBarbero(selectedBarbero, startOfDay, endOfDay, dateStr)
        setAvailableTimeSlots(slots)
      }
    } catch (err) {
      console.error('Error fetching time slots:', err)
      setAvailableTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSelectBarbero = (barbero) => {
    setSelectedBarbero(barbero)
    setStep(2)
  }

  const handleSelectServicio = (servicio) => {
    setSelectedServicio(servicio)
    setStep(3)
  }

  const handleSelectDateTime = () => {
    if (selectedDate && selectedTime) {
      setStep(4)
    }
  }

  const handleNombreChange = (e) => {
    setClienteNombre(e.target.value)
    if (formErrors.nombre) setFormErrors(prev => ({ ...prev, nombre: undefined }))
  }

  const handleWhatsappChange = (value) => {
    setClienteWhatsapp(value)
    if (formErrors.whatsapp) setFormErrors(prev => ({ ...prev, whatsapp: undefined }))
  }

  const validateContactForm = () => {
    const errors = {}

    if (!clienteNombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    }

    if (!clienteWhatsapp || !isValidPhoneNumber(clienteWhatsapp)) {
      errors.whatsapp = 'Ingresa un número de WhatsApp válido con código de país'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitBooking = async () => {
    if (!validateContactForm()) return

    try {
      setLoading(true)
      setSubmitError(null)

      // Re-validate that the slot is still free before writing to the DB
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const activeBarbero = resolvedBarbero || selectedBarbero

      const freshSlots = await fetchSlotsForBarbero(activeBarbero, startOfDay, endOfDay, dateStr)
      if (!freshSlots.includes(selectedTime)) {
        setSelectedTime(null)
        setAvailableTimeSlots(freshSlots)
        setStep(3)
        setSubmitError('El horario seleccionado ya no está disponible. Por favor elige otro horario.')
        setLoading(false)
        return
      }

      // Combine date and time
      const fechaHora = combineDateAndTime(
        format(selectedDate, 'yyyy-MM-dd'),
        selectedTime
      )

      // Normalize phone number (already E.164 from PhoneInput)
      const normalizedPhone = clienteWhatsapp

      // Create cita
      const citaData = {
        sede_id: sede.id,
        barbero_id: activeBarbero.id,
        servicio_id: selectedServicio.id,
        cliente_nombre: clienteNombre.trim(),
        cliente_whatsapp: normalizedPhone,
        fecha_hora: formatForDatabase(fechaHora),
        duracion_minutos: selectedServicio.duracion_minutos,
        precio_total: selectedServicio.precio,
        estado: 'pendiente',
        ...(user ? { cliente_id: user.id } : {})
      }

      const { data, error: createError } = await supabase
        .from('citas')
        .insert([citaData])
        .select()
        .single()

      if (createError) throw createError

      // Persist contact info to the user's profile so future bookings are pre-filled
      if (user) {
        await supabase
          .from('profiles')
          .update({
            ...(clienteNombre.trim() ? { nombre_completo: clienteNombre.trim() } : {}),
            ...(normalizedPhone ? { telefono: normalizedPhone } : {})
          })
          .eq('id', user.id)
        // Ignore errors — this is a best-effort update
      }

      // Generate WhatsApp link
      const whatsappLink = generateWhatsAppLink({
        sedeWhatsapp: sede.whatsapp,
        sedeName: sede.nombre,
        barberoName: activeBarbero.nombre,
        servicioName: selectedServicio.nombre,
        fechaHora: fechaHora,
        precio: selectedServicio.precio,
        clienteNombre: clienteNombre.trim()
      })

      // Redirect to WhatsApp
      window.location.href = whatsappLink
    } catch (err) {
      console.error('Error creating booking:', err)
      setSubmitError('Error al crear la reserva. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !sede) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => { setError(null); fetchSedeData() }}
            className="bg-gold hover:bg-gold/90 text-black font-semibold py-2 px-6 rounded-lg transition-colors mr-3"
          >
            Reintentar
          </button>
          <Link to="/" className="text-gray-400 hover:text-white text-sm underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {user && (
            <Link
              to="/mis-citas"
              className="absolute right-0 top-0 flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mis citas
            </Link>
          )}
          <h1 className="text-4xl font-bold text-gold mb-2">{sede?.nombre}</h1>
          <p className="text-gray-400">Reserva tu cita en simples pasos</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step
                      ? 'bg-gold text-black'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      s < step ? 'bg-gold' : 'bg-gray-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-2xl mx-auto mt-2 text-xs text-gray-400">
            <span>Barbero</span>
            <span>Servicio</span>
            <span>Fecha/Hora</span>
            <span>Contacto</span>
          </div>
        </div>

        {/* Step 1: Select Barbero */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Selecciona tu barbero
            </h2>
            {barberos.length === 0 ? (
              <p className="text-gray-400">No hay barberos disponibles</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barberos.length > 1 && (
                  <button
                    onClick={() => handleSelectBarbero(ANY_BARBERO)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-colors border-2 border-transparent hover:border-gold md:col-span-2"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-gold text-2xl">
                        ✂
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Cualquier barbero disponible</h3>
                        <p className="text-sm text-gray-400">Te asignamos el barbero con más disponibilidad ese día</p>
                      </div>
                    </div>
                  </button>
                )}
                {barberos.map((barbero) => (
                  <button
                    key={barbero.id}
                    onClick={() => handleSelectBarbero(barbero)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-colors border-2 border-transparent hover:border-gold"
                  >
                    <div className="flex items-center space-x-4">
                      {barbero.foto_url ? (
                        <img
                          src={barbero.foto_url}
                          alt={barbero.nombre}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-black font-bold text-xl">
                          {barbero.nombre.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {barbero.nombre}
                        </h3>
                        {barbero.especialidad && (
                          <p className="text-sm text-gray-400">
                            {barbero.especialidad}
                          </p>
                        )}
                        {barbero.instagram && (
                          <p className="text-xs text-pink-400 mt-1">
                            <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            @{barbero.instagram}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Servicio */}
        {step === 2 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <button
              onClick={() => setStep(1)}
              className="text-gold hover:text-gold/80 mb-4 flex items-center"
            >
              ← Cambiar barbero
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">
              Selecciona el servicio
            </h2>
            <p className="text-gray-400 mb-6">
              Barbero: <span className="text-white">{selectedBarbero?.id === 'any' ? 'Cualquier barbero disponible' : selectedBarbero?.nombre}</span>
            </p>
            {servicios.length === 0 ? (
              <p className="text-gray-400">No hay servicios disponibles</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicios.map((servicio) => (
                  <button
                    key={servicio.id}
                    onClick={() => handleSelectServicio(servicio)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-colors border-2 border-transparent hover:border-gold"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {servicio.nombre}
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gold font-semibold">
                        ${servicio.precio.toLocaleString('es-MX')}
                      </span>
                      <span className="text-gray-400">
                        {servicio.duracion_minutos} min
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Date and Time */}
        {step === 3 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <button
              onClick={() => setStep(2)}
              className="text-gold hover:text-gold/80 mb-4 flex items-center"
            >
              ← Cambiar servicio
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">
              Selecciona fecha y hora
            </h2>
            <div className="text-gray-400 mb-6">
              <p>Barbero: <span className="text-white">
                {selectedBarbero?.id === 'any'
                  ? (resolvedBarbero ? `${resolvedBarbero.nombre} (asignado)` : 'Buscando disponibilidad...')
                  : selectedBarbero?.nombre}
              </span></p>
              <p>Servicio: <span className="text-white">{selectedServicio?.nombre}</span></p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date)
                    setSelectedTime(null)
                  }}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  locale={es}
                  inline
                  calendarClassName="custom-datepicker"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hora disponible
                </label>
                {!selectedDate ? (
                  <p className="text-gray-500">Selecciona una fecha primero</p>
                ) : loadingSlots ? (
                  <p className="text-gray-400">Cargando horarios...</p>
                ) : availableTimeSlots.length === 0 ? (
                  <p className="text-gray-400">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                    {availableTimeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                          selectedTime === time
                            ? 'bg-gold text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedDate && selectedTime && (
              <button
                onClick={handleSelectDateTime}
                className="mt-6 w-full bg-gold hover:bg-gold/90 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {/* Step 4: Contact Information */}
        {step === 4 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <button
              onClick={() => setStep(3)}
              className="text-gold hover:text-gold/80 mb-4 flex items-center"
            >
              ← Cambiar fecha/hora
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">
              Confirma tu información
            </h2>

            {/* Booking Summary */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gold mb-3">Resumen de tu cita</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-400">Barbero:</span>{' '}
                  {resolvedBarbero ? resolvedBarbero.nombre : selectedBarbero?.nombre}
                  {resolvedBarbero && <span className="text-xs text-gray-400 ml-1">(asignado)</span>}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Servicio:</span> {selectedServicio?.nombre}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Fecha:</span>{' '}
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Hora:</span> {selectedTime}
                </p>
                <p className="text-lg font-semibold text-gold mt-3">
                  Total: ${selectedServicio?.precio.toLocaleString('es-MX')}
                </p>
              </div>
            </div>

            {/* Inline submission error */}
            {submitError && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4 text-red-300 text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* Contact Form — pre-filled when logged in, editable in all cases */}
            <div className="space-y-4">
              {profileDataLoaded && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Datos cargados desde tu perfil — puedes modificarlos si es necesario
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tu nombre completo *
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={handleNombreChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Juan Pérez"
                />
                {formErrors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tu WhatsApp *
                </label>
                <PhoneInput
                  value={clienteWhatsapp}
                  onChange={handleWhatsappChange}
                  placeholder="Número de WhatsApp"
                />
                {formErrors.whatsapp && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.whatsapp}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Te contactaremos por WhatsApp para confirmar tu cita
                </p>
              </div>

              {!user && (
                <p className="text-xs text-gray-400 text-center">
                  ¿Tienes cuenta?{' '}
                  <Link to="/login" className="text-gold hover:underline">Inicia sesión</Link>{' '}
                  para autocompletar tus datos.
                </p>
              )}

              <button
                onClick={handleSubmitBooking}
                disabled={loading}
                className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : 'Confirmar y abrir WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom DatePicker Styles */}
      <style>{`
        .custom-datepicker {
          background-color: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.5rem;
        }
        .react-datepicker__header {
          background-color: #111827;
          border-bottom: 1px solid #374151;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: #D4AF37;
        }
        .react-datepicker__day {
          color: #d1d5db;
        }
        .react-datepicker__day:hover {
          background-color: #374151;
        }
        .react-datepicker__day--selected {
          background-color: #D4AF37;
          color: #000;
        }
        .react-datepicker__day--disabled {
          color: #6b7280;
        }
      `}</style>
    </div>
  )
}
