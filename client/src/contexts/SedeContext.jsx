import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "./AuthContext"

const SedeContext = createContext({})

export const useSede = () => {
  const context = useContext(SedeContext)
  if (!context) throw new Error("useSede must be used within SedeProvider")
  return context
}

export function SedeProvider({ children }) {
  const { user } = useAuth()
  const [sedes, setSedes] = useState([])
  const [selectedSede, setSelectedSede] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSedes = useCallback(async () => {
    if (!user) {
      console.log('🏢 SedeContext: No user, clearing sedes')
      setSedes([])
      setSelectedSede(null)
      setLoading(false)
      return
    }

    try {
      console.log('🏢 Fetching sedes for user:', user.id)
      setLoading(true)
      const { data, error } = await supabase
        .from("sedes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at")
      
      if (error) throw error
      
      console.log('🏢 Sedes loaded:', data?.length || 0)
      setSedes(data || [])
    } catch (error) {
      console.error("❌ Error fetching sedes:", error)
      setSedes([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch sedes when user changes
  useEffect(() => {
    console.log('🏢 SedeContext: user changed', user?.id)
    fetchSedes()
  }, [user?.id, fetchSedes])

  // Auto-select sede when sedes list changes
  useEffect(() => {
    if (sedes.length > 0) {
      // If no sede selected, or current selection is not in list, select first
      if (!selectedSede || !sedes.find(s => s.id === selectedSede.id)) {
        console.log('🏢 Auto-selecting first sede:', sedes[0].nombre)
        setSelectedSede(sedes[0])
      }
    } else {
      if (selectedSede) {
        console.log('🏢 Clearing selected sede (no sedes available)')
        setSelectedSede(null)
      }
    }
  }, [sedes, selectedSede])

  async function createSede(sedeData) {
    try {
      const { data, error } = await supabase.from("sedes").insert([{ ...sedeData, owner_id: user.id }]).select().single()
      if (error) throw error
      setSedes([...sedes, data])
      setSelectedSede(data)
      return { data, error: null }
    } catch (error) {
      console.error("Error creating sede:", error)
      return { data: null, error }
    }
  }

  async function updateSede(id, updates) {
    try {
      const { data, error } = await supabase
        .from("sedes")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      setSedes(sedes.map(s => s.id === id ? data : s))
      
      // If updating the selected sede, update it too
      if (selectedSede?.id === id) {
        setSelectedSede(data)
      }
      
      return { data, error: null }
    } catch (error) {
      console.error("❌ Error updating sede:", error)
      return { data: null, error }
    }
  }

  async function deleteSede(id) {
    try {
      const { error } = await supabase
        .from("sedes")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      
      // Update local state
      setSedes(sedes.filter(s => s.id !== id))
      
      // If deleting the selected sede, clear selection
      if (selectedSede?.id === id) {
        setSelectedSede(null)
      }
      
      return { error: null }
    } catch (error) {
      console.error("❌ Error deleting sede:", error)
      return { error }
    }
  }

  const value = { 
    sedes, 
    selectedSede, 
    setSelectedSede, 
    loading, 
    fetchSedes, 
    createSede, 
    updateSede, 
    deleteSede 
  }
  return <SedeContext.Provider value={value}>{children}</SedeContext.Provider>
}
