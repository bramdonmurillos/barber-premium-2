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
      
      const [sedesRes, citasRes, barberosRes] = await Promise.all([
        supabase
          .from('sedes')
          .select('id', { count: 'exact' })
          .eq('owner_id', user.id),
        supabase
          .from('citas')
          .select('id', { count: 'exact' })
          .gte('fecha_hora', today),
        supabase
          .from('barberos')
          .select('id', { count: 'exact' })
          .eq('activo', true)
      ])

      setStats({
        totalSedes: sedesRes.count || 0,
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
