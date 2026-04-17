import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    const redirect = async () => {
      setChecking(true)
      const [{ data: ownedSedes }, { data: adminSedes }] = await Promise.all([
        supabase.from('sedes').select('id').eq('owner_id', user.id).limit(1),
        supabase.from('barberia_admins').select('id').eq('user_id', user.id).limit(1),
      ])
      const isAdmin = (ownedSedes?.length > 0) || (adminSedes?.length > 0)
      navigate(isAdmin ? '/dashboard' : '/mis-citas', { replace: true })
    }
    redirect()
  }, [user, authLoading, navigate])

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gold mb-4">
          BarberFlow
        </h1>
        <p className="text-gray-300 text-xl mb-8">
          Gestión profesional para barberías multi-sede
        </p>
        <a
          href="/login"
          className="inline-block bg-gold hover:bg-gold-600 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Acceder al Dashboard
        </a>
      </div>
    </div>
  )
}
