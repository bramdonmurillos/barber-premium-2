import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSede } from './SedeContext'
import { deleteImage } from '../utils/imageUpload'

const BarberoContext = createContext({})

export const useBarbero = () => {
  const context = useContext(BarberoContext)
  if (!context) throw new Error('useBarbero must be used within BarberoProvider')
  return context
}

export function BarberoProvider({ children }) {
  const { selectedSede } = useSede()
  const [barberos, setBarberos] = useState([])
  const [indisponibilidades, setIndisponibilidades] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBarberos = useCallback(async () => {
    if (!selectedSede) {
      console.log('👨‍💼 BarberoContext: No sede selected, clearing barberos')
      setBarberos([])
      setLoading(false)
      return
    }

    try {
      console.log('👨‍💼 Fetching barberos for sede:', selectedSede.nombre)
      setLoading(true)
      const { data, error } = await supabase
        .from('barberos')
        .select('*')
        .eq('sede_id', selectedSede.id)
        .order('orden', { ascending: true })
        .order('nombre', { ascending: true })
      
      if (error) throw error
      
      console.log('👨‍💼 Barberos loaded:', data?.length || 0)
      setBarberos(data || [])
    } catch (error) {
      console.error('❌ Error fetching barberos:', error)
      setBarberos([])
    } finally {
      setLoading(false)
    }
  }, [selectedSede])

  // Fetch barberos when selected sede changes
  useEffect(() => {
    fetchBarberos()
  }, [fetchBarberos])

  async function createBarbero(barberoData) {
    if (!selectedSede) {
      return { data: null, error: { message: 'No hay sede seleccionada' } }
    }

    try {
      const { data, error } = await supabase
        .from('barberos')
        .insert([{ ...barberoData, sede_id: selectedSede.id }])
        .select()
        .single()
      
      if (error) throw error
      
      setBarberos([...barberos, data])
      console.log('✅ Barbero created:', data.nombre)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating barbero:', error)
      return { data: null, error }
    }
  }

  async function updateBarbero(id, updates) {
    try {
      const { data, error } = await supabase
        .from('barberos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setBarberos(barberos.map(b => b.id === id ? data : b))
      console.log('✅ Barbero updated:', data.nombre)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating barbero:', error)
      return { data: null, error }
    }
  }

  async function deleteBarbero(id) {
    try {
      // Get barbero data to check for image
      const barbero = barberos.find(b => b.id === id)
      
      // Delete image from storage if exists
      if (barbero?.foto_storage_path) {
        await deleteImage('barberos-fotos', barbero.foto_storage_path)
      }

      const { error } = await supabase
        .from('barberos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setBarberos(barberos.filter(b => b.id !== id))
      console.log('✅ Barbero deleted')
      return { error: null }
    } catch (error) {
      console.error('❌ Error deleting barbero:', error)
      return { error }
    }
  }

  // ==================== INDISPONIBILIDAD METHODS ====================

  async function fetchIndisponibilidades(barberoId) {
    if (!barberoId) {
      console.log('⏰ BarberoContext: No barbero ID provided')
      return { data: [], error: null }
    }

    try {
      console.log('⏰ Fetching indisponibilidades for barbero:', barberoId)
      const { data, error } = await supabase
        .from('barbero_indisponibilidad')
        .select('*')
        .eq('barbero_id', barberoId)
        .order('fecha_inicio', { ascending: true })
      
      if (error) throw error
      
      console.log('⏰ Indisponibilidades loaded:', data?.length || 0)
      setIndisponibilidades(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Error fetching indisponibilidades:', error)
      return { data: [], error }
    }
  }

  async function createIndisponibilidad(barberoId, indisponibilidadData) {
    if (!barberoId) {
      return { data: null, error: { message: 'No hay barbero especificado' } }
    }

    try {
      const { data, error } = await supabase
        .from('barbero_indisponibilidad')
        .insert([{ ...indisponibilidadData, barbero_id: barberoId }])
        .select()
        .single()
      
      if (error) throw error
      
      setIndisponibilidades([...indisponibilidades, data])
      console.log('✅ Indisponibilidad created')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error creating indisponibilidad:', error)
      return { data: null, error }
    }
  }

  async function updateIndisponibilidad(id, updates) {
    try {
      const { data, error } = await supabase
        .from('barbero_indisponibilidad')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      setIndisponibilidades(indisponibilidades.map(i => i.id === id ? data : i))
      console.log('✅ Indisponibilidad updated')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating indisponibilidad:', error)
      return { data: null, error }
    }
  }

  async function deleteIndisponibilidad(id) {
    try {
      const { error } = await supabase
        .from('barbero_indisponibilidad')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setIndisponibilidades(indisponibilidades.filter(i => i.id !== id))
      console.log('✅ Indisponibilidad deleted')
      return { error: null }
    } catch (error) {
      console.error('❌ Error deleting indisponibilidad:', error)
      return { error }
    }
  }

  const value = {
    barberos,
    indisponibilidades,
    loading,
    fetchBarberos,
    createBarbero,
    updateBarbero,
    deleteBarbero,
    fetchIndisponibilidades,
    createIndisponibilidad,
    updateIndisponibilidad,
    deleteIndisponibilidad
  }

  return <BarberoContext.Provider value={value}>{children}</BarberoContext.Provider>
}
