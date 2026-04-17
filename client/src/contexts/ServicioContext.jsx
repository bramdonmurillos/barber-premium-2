import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSede } from './SedeContext'

const ServicioContext = createContext({})

export const useServicio = () => {
  const context = useContext(ServicioContext)
  if (!context) throw new Error('useServicio must be used within ServicioProvider')
  return context
}

export function ServicioProvider({ children }) {
  const { selectedSede } = useSede()
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchServicios = useCallback(async () => {
    if (!selectedSede) {
      console.log('✂️ ServicioContext: No sede selected, clearing servicios')
      setServicios([])
      setLoading(false)
      return
    }

    try {
      console.log('✂️ Fetching servicios for sede:', selectedSede.nombre)
      setLoading(true)
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('sede_id', selectedSede.id)
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true })
      
      if (error) throw error
      
      console.log('✂️ Servicios loaded:', data?.length || 0)
      setServicios(data || [])
    } catch (error) {
      console.error('❌ Error fetching servicios:', error)
      setServicios([])
    } finally {
      setLoading(false)
    }
  }, [selectedSede])

  // Fetch servicios when selected sede changes
  useEffect(() => {
    fetchServicios()
  }, [fetchServicios])

  async function createServicio(servicioData) {
    if (!selectedSede) {
      return { data: null, error: { message: 'No hay sede seleccionada' } }
    }

    try {
      const { data, error } = await supabase
        .from('servicios')
        .insert([{ ...servicioData, sede_id: selectedSede.id }])
        .select()
        .single()
      
      if (error) throw error
      
      setServicios([...servicios, data])
      console.log('✅ Servicio created:', data.nombre)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating servicio:', error)
      return { data: null, error }
    }
  }

  async function updateServicio(id, updates) {
    try {
      const { data, error } = await supabase
        .from('servicios')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setServicios(servicios.map(s => s.id === id ? data : s))
      console.log('✅ Servicio updated:', data.nombre)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating servicio:', error)
      return { data: null, error }
    }
  }

  async function deleteServicio(id) {
    try {
      const { error } = await supabase
        .from('servicios')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setServicios(servicios.filter(s => s.id !== id))
      console.log('✅ Servicio deleted')
      return { error: null }
    } catch (error) {
      console.error('❌ Error deleting servicio:', error)
      return { error }
    }
  }

  const value = {
    servicios,
    loading,
    fetchServicios,
    createServicio,
    updateServicio,
    deleteServicio
  }

  return <ServicioContext.Provider value={value}>{children}</ServicioContext.Provider>
}
