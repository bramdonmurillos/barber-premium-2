import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSede } from './SedeContext'

const CitaContext = createContext()

export function useCita() {
  const context = useContext(CitaContext)
  if (!context) {
    throw new Error('useCita debe usarse dentro de CitaProvider')
  }
  return context
}

export function CitaProvider({ children }) {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { selectedSede } = useSede()

  // Fetch citas for the selected sede
  const fetchCitas = async (sedeId = null) => {
    try {
      setLoading(true)
      setError(null)

      const targetSedeId = sedeId || selectedSede?.id
      if (!targetSedeId) {
        setCitas([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('citas')
        .select(`
          *,
          barbero:barberos(id, nombre, foto_url),
          servicio:servicios(id, nombre, precio, duracion_minutos)
        `)
        .eq('sede_id', targetSedeId)
        .order('fecha_hora', { ascending: false })

      if (fetchError) throw fetchError

      setCitas(data || [])
    } catch (err) {
      console.error('Error fetching citas:', err)
      setError(err.message)
      setCitas([])
    } finally {
      setLoading(false)
    }
  }

  // Create a new cita (public booking)
  const createCita = async (citaData) => {
    try {
      setError(null)

      const { data, error: createError } = await supabase
        .from('citas')
        .insert([citaData])
        .select(`
          *,
          barbero:barberos(id, nombre, foto_url),
          servicio:servicios(id, nombre, precio, duracion_minutos)
        `)
        .single()

      if (createError) throw createError

      // Add the new cita to the list
      setCitas(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      console.error('Error creating cita:', err)
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  // Update cita status (admin only)
  const updateCita = async (citaId, updates) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('citas')
        .update(updates)
        .eq('id', citaId)
        .select(`
          *,
          barbero:barberos(id, nombre, foto_url),
          servicio:servicios(id, nombre, precio, duracion_minutos)
        `)
        .single()

      if (updateError) throw updateError

      // Update the cita in the list
      setCitas(prev => prev.map(c => c.id === citaId ? data : c))
      return { data, error: null }
    } catch (err) {
      console.error('Error updating cita:', err)
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  // Delete a cita (admin only)
  const deleteCita = async (citaId) => {
    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('citas')
        .delete()
        .eq('id', citaId)

      if (deleteError) throw deleteError

      // Remove the cita from the list
      setCitas(prev => prev.filter(c => c.id !== citaId))
      return { error: null }
    } catch (err) {
      console.error('Error deleting cita:', err)
      setError(err.message)
      return { error: err.message }
    }
  }

  // Fetch citas for a specific barbero on a specific date (for time slot availability)
  const fetchCitasForBarberoOnDate = async (barberoId, date) => {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error: fetchError } = await supabase
        .from('citas')
        .select('*')
        .eq('barbero_id', barberoId)
        .gte('fecha_hora', startOfDay.toISOString())
        .lte('fecha_hora', endOfDay.toISOString())
        .in('estado', ['pendiente', 'confirmada']) // Exclude cancelled

      if (fetchError) throw fetchError

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error fetching citas for barbero:', err)
      return { data: [], error: err.message }
    }
  }

  // Re-fetch citas when selected sede changes
  useEffect(() => {
    if (selectedSede?.id) {
      fetchCitas(selectedSede.id)
    } else {
      setCitas([])
    }
  }, [selectedSede?.id])

  // Realtime subscription for citas
  useEffect(() => {
    if (!selectedSede?.id) return

    // Subscribe to citas changes for the selected sede
    const channel = supabase
      .channel('citas-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'citas',
          filter: `sede_id=eq.${selectedSede.id}`
        },
        async (payload) => {
          console.log('Nueva cita creada:', payload.new)
          
          // Fetch the full cita with relations
          const { data } = await supabase
            .from('citas')
            .select(`
              *,
              barbero:barberos(id, nombre, foto_url),
              servicio:servicios(id, nombre, precio, duracion_minutos)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setCitas(prev => [data, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'citas',
          filter: `sede_id=eq.${selectedSede.id}`
        },
        async (payload) => {
          console.log('Cita actualizada:', payload.new)
          
          // Fetch the full cita with relations
          const { data } = await supabase
            .from('citas')
            .select(`
              *,
              barbero:barberos(id, nombre, foto_url),
              servicio:servicios(id, nombre, precio, duracion_minutos)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setCitas(prev => prev.map(c => c.id === data.id ? data : c))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'citas',
          filter: `sede_id=eq.${selectedSede.id}`
        },
        (payload) => {
          console.log('Cita eliminada:', payload.old)
          setCitas(prev => prev.filter(c => c.id !== payload.old.id))
        }
      )
      .subscribe()

    // Cleanup subscription on unmount or sede change
    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedSede?.id])

  const value = {
    citas,
    loading,
    error,
    fetchCitas,
    createCita,
    updateCita,
    deleteCita,
    fetchCitasForBarberoOnDate
  }

  return <CitaContext.Provider value={value}>{children}</CitaContext.Provider>
}
