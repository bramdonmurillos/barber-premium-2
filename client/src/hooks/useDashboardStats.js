import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useDashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSedes: 0,
    citasHoy: 0,
    barberosActivos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchStats() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // First, get user's sedes
      const { data: userSedes, error: sedesError } = await supabase
        .from('sedes')
        .select('id')
        .eq('owner_id', user.id)
      
      if (sedesError) throw sedesError
      
      const sedeIds = userSedes?.map(s => s.id) || []
      
      // If user has no sedes, return zeros
      if (sedeIds.length === 0) {
        setStats({
          totalSedes: 0,
          citasHoy: 0,
          barberosActivos: 0
        })
        return
      }
      
      // Fetch stats filtered by user's sedes
      const [citasRes, barberosRes] = await Promise.all([
        supabase
          .from('citas')
          .select('id', { count: 'exact' })
          .in('sede_id', sedeIds)
          .gte('fecha_hora', today),
        supabase
          .from('barberos')
          .select('id', { count: 'exact' })
          .in('sede_id', sedeIds)
          .eq('activo', true)
      ])

      setStats({
        totalSedes: sedeIds.length,
        citasHoy: citasRes.count || 0,
        barberosActivos: barberosRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return { ...stats, loading }
}
